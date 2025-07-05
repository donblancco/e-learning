from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
import csv
import io
from .models import Genre, Question, Choice
from .serializers import GenreSerializer, QuestionSerializer, ChoiceSerializer
from accounts.serializers import UserSerializer
from progress.models import UserAttempt, QuizSession, UserProgress

User = get_user_model()


class AdminPagination(PageNumberPagination):
    """
    管理者用ページネーション
    page_size パラメータで動的にページサイズを変更可能
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 10000


class AdminGenreListCreateView(generics.ListCreateAPIView):
    """
    管理者用ジャンル一覧取得・作成API
    """
    queryset = Genre.objects.all().order_by('name')
    serializer_class = GenreSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    
    def perform_create(self, serializer):
        """新規作成時にIDを自動生成"""
        if 'id' not in serializer.validated_data or not serializer.validated_data.get('id'):
            serializer.save(id=Genre.generate_next_id())
        else:
            serializer.save()


class AdminGenreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    管理者用ジャンル詳細・更新・削除API
    """
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAdminUser]


class AdminQuestionListCreateView(generics.ListCreateAPIView):
    """
    管理者用問題一覧取得・作成API
    """
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    
    def get_queryset(self):
        queryset = Question.objects.all().order_by('-created_at')
        
        # フィルタリング
        genre = self.request.query_params.get('genre')
        if genre:
            queryset = queryset.filter(genre_id=genre)
        
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(body__icontains=search)
            )
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # レビュー状態フィルター
        reviewed_at__isnull = self.request.query_params.get('reviewed_at__isnull')
        if reviewed_at__isnull is not None:
            queryset = queryset.filter(reviewed_at__isnull=reviewed_at__isnull.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """新規作成時にIDを自動生成し、選択肢も保存"""
        # IDの自動生成
        if 'id' not in serializer.validated_data or not serializer.validated_data.get('id'):
            question_id = Question.generate_next_id()
        else:
            question_id = serializer.validated_data.get('id')
        
        # 選択肢データを取得
        choices_data = self.request.data.get('choices', [])
        
        # 問題を保存（選択肢は後で保存）
        question = serializer.save(id=question_id, author_user=self.request.user)
        
        # 選択肢を保存
        for choice_data in choices_data:
            Choice.objects.create(
                id=Choice.generate_next_id(),
                question=question,
                content=choice_data.get('content', ''),
                is_correct=choice_data.get('is_correct', False),
                order_index=choice_data.get('order_index', 0)
            )


class AdminQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    管理者用問題詳細・更新・削除API
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminUser]
    
    def perform_update(self, serializer):
        """問題更新時に選択肢も更新"""
        # 選択肢データを取得
        choices_data = self.request.data.get('choices', [])
        
        # 問題を保存
        question = serializer.save(modified_user=self.request.user)
        
        # 既存の選択肢を削除
        question.choices.all().delete()
        
        # 新しい選択肢を保存
        for choice_data in choices_data:
            Choice.objects.create(
                id=Choice.generate_next_id(),
                question=question,
                content=choice_data.get('content', ''),
                is_correct=choice_data.get('is_correct', False),
                order_index=choice_data.get('order_index', 0)
            )


class AdminUserListView(generics.ListAPIView):
    """
    管理者用ユーザー一覧取得API
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        # フィルタリング
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) | 
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search)
            )
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        is_staff = self.request.query_params.get('is_staff')
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        return queryset


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """
    管理者用ユーザー詳細・更新API
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class AdminStatsView(APIView):
    """
    管理者用統計情報取得API
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_questions = Question.objects.count()
        active_questions = Question.objects.filter(is_active=True).count()
        total_genres = Genre.objects.count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'total_questions': total_questions,
            'active_questions': active_questions,
            'total_genres': total_genres,
        })


class AdminQuestionBulkActionView(APIView):
    """
    管理者用問題一括操作API
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        action = request.data.get('action')
        question_ids = request.data.get('question_ids', [])
        
        if not action or not question_ids:
            return Response(
                {'error': 'アクションと問題IDが必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        questions = Question.objects.filter(id__in=question_ids)
        
        if action == 'activate':
            questions.update(is_active=True)
            message = f'{questions.count()}件の問題を有効化しました'
        elif action == 'deactivate':
            questions.update(is_active=False)
            message = f'{questions.count()}件の問題を無効化しました'
        elif action == 'delete':
            count = questions.count()
            questions.delete()
            message = f'{count}件の問題を削除しました'
        else:
            return Response(
                {'error': '無効なアクションです'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': message})


class AdminQuestionBulkUpdateView(APIView):
    """
    管理者用問題一括更新API
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        question_ids = request.data.get('question_ids', [])
        updates = request.data.get('updates', {})
        
        if not question_ids or not updates:
            return Response(
                {'error': '問題IDと更新内容が必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 問題を取得
        questions = Question.objects.filter(id__in=question_ids)
        
        if not questions.exists():
            return Response(
                {'error': '指定された問題が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 更新内容を検証
        update_data = {}
        
        if 'genre' in updates:
            try:
                genre = Genre.objects.get(id=updates['genre'])
                update_data['genre'] = genre
            except Genre.DoesNotExist:
                return Response(
                    {'error': '指定されたジャンルが見つかりません'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if 'difficulty' in updates:
            difficulty = updates['difficulty']
            if difficulty not in [1, 2, 3]:
                return Response(
                    {'error': '難易度は1から3の値である必要があります（1:初級、2:中級、3:上級）'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            update_data['difficulty'] = difficulty
        
        if 'reviewed_at' in updates:
            # None（null）を指定してレビュー日時をリセット
            update_data['reviewed_at'] = updates['reviewed_at']
        
        # 一括更新を実行
        if update_data:
            updated_count = questions.update(**update_data)
            
            # 更新されたフィールドの説明を作成
            updated_fields = []
            if 'genre' in update_data:
                updated_fields.append(f'ジャンル: {update_data["genre"].name}')
            if 'difficulty' in update_data:
                updated_fields.append(f'難易度: {update_data["difficulty"]}')
            if 'reviewed_at' in update_data:
                if update_data['reviewed_at'] is None:
                    updated_fields.append('レビュー状態: リセット')
                else:
                    updated_fields.append('レビュー状態: 完了')
            
            message = f'{updated_count}件の問題を更新しました ({", ".join(updated_fields)})'
        else:
            message = '更新する項目がありません'
        
        return Response({'message': message})


class AdminUserProgressView(APIView):
    """
    管理者用ユーザー学習進捗取得API
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, user_id=None):
        if user_id:
            # 特定ユーザーの詳細進捗
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'ユーザーが見つかりません'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # 基本統計
            total_attempts = UserAttempt.objects.filter(user=user).count()
            correct_attempts = UserAttempt.objects.filter(user=user, is_correct=True).count()
            accuracy_rate = round((correct_attempts / total_attempts * 100), 1) if total_attempts > 0 else 0
            
            # セッション統計
            completed_sessions = QuizSession.objects.filter(user=user, is_completed=True)
            total_sessions = completed_sessions.count()
            avg_score = completed_sessions.aggregate(avg_score=Avg('correct_answers'))['avg_score'] or 0
            
            # ジャンル別進捗
            genre_progress = []
            for progress in UserProgress.objects.filter(user=user).select_related('genre'):
                genre_progress.append({
                    'genre_id': progress.genre.id,
                    'genre_name': progress.genre.name,
                    'total_attempts': progress.total_attempts,
                    'correct_attempts': progress.correct_attempts,
                    'accuracy_rate': progress.accuracy_rate,
                    'last_study_date': progress.last_study_date,
                })
            
            # 最近の活動
            recent_attempts = UserAttempt.objects.filter(
                user=user,
                attempt_time__gte=timezone.now() - timedelta(days=30)
            ).select_related('question', 'question__genre').order_by('-attempt_time')[:10]
            
            recent_activity = []
            for attempt in recent_attempts:
                # titleフィールドの最初の50文字を使用、なければIDを表示
                question_title = attempt.question.title
                if question_title and len(question_title) > 50:
                    question_title = question_title[:50] + '...'
                elif not question_title:
                    question_title = f'問題 {attempt.question.id}'
                
                recent_activity.append({
                    'question_id': attempt.question.id,
                    'question_title': question_title,
                    'genre_name': attempt.question.genre.name,
                    'is_correct': attempt.is_correct,
                    'attempt_time': attempt.attempt_time,
                })
            
            return Response({
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'total_attempts': total_attempts,
                'correct_attempts': correct_attempts,
                'accuracy_rate': accuracy_rate,
                'total_sessions': total_sessions,
                'avg_score': round(avg_score, 1) if avg_score else 0,
                'genre_progress': genre_progress,
                'recent_activity': recent_activity,
            })
        else:
            # 全ユーザーの進捗サマリー
            users_with_progress = []
            
            for user in User.objects.filter(is_active=True).order_by('username'):
                total_attempts = UserAttempt.objects.filter(user=user).count()
                correct_attempts = UserAttempt.objects.filter(user=user, is_correct=True).count()
                accuracy_rate = round((correct_attempts / total_attempts * 100), 1) if total_attempts > 0 else 0
                
                completed_sessions = QuizSession.objects.filter(user=user, is_completed=True).count()
                
                last_activity = UserAttempt.objects.filter(user=user).order_by('-attempt_time').first()
                last_activity_date = last_activity.attempt_time if last_activity else None
                
                users_with_progress.append({
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff,
                    'total_attempts': total_attempts,
                    'correct_attempts': correct_attempts,
                    'accuracy_rate': accuracy_rate,
                    'completed_sessions': completed_sessions,
                    'last_activity': last_activity_date,
                })
            
            return Response({
                'users': users_with_progress,
                'total_users': len(users_with_progress),
            })


class AdminUserStatsView(APIView):
    """
    管理者用ユーザー統計情報API
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # 期間フィルター
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # 基本統計
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        # 学習活動統計
        active_learners = UserAttempt.objects.filter(
            attempt_time__gte=start_date
        ).values('user').distinct().count()
        
        total_attempts = UserAttempt.objects.filter(attempt_time__gte=start_date).count()
        correct_attempts = UserAttempt.objects.filter(
            attempt_time__gte=start_date, is_correct=True
        ).count()
        
        overall_accuracy = round((correct_attempts / total_attempts * 100), 1) if total_attempts > 0 else 0
        
        # ジャンル別統計
        genre_stats = []
        for genre in Genre.objects.all():
            genre_attempts = UserAttempt.objects.filter(
                question__genre=genre,
                attempt_time__gte=start_date
            )
            total = genre_attempts.count()
            correct = genre_attempts.filter(is_correct=True).count()
            accuracy = round((correct / total * 100), 1) if total > 0 else 0
            
            genre_stats.append({
                'genre_id': genre.id,
                'genre_name': genre.name,
                'total_attempts': total,
                'correct_attempts': correct,
                'accuracy_rate': accuracy,
                'unique_users': genre_attempts.values('user').distinct().count()
            })
        
        # 日次活動データ（グラフ用）
        daily_activity = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            
            daily_attempts = UserAttempt.objects.filter(
                attempt_time__gte=date,
                attempt_time__lt=next_date
            ).count()
            
            daily_users = UserAttempt.objects.filter(
                attempt_time__gte=date,
                attempt_time__lt=next_date
            ).values('user').distinct().count()
            
            daily_activity.append({
                'date': date.strftime('%Y-%m-%d'),
                'attempts': daily_attempts,
                'active_users': daily_users,
            })
        
        return Response({
            'period_days': days,
            'total_users': total_users,
            'active_users': active_users,
            'active_learners': active_learners,
            'total_attempts': total_attempts,
            'correct_attempts': correct_attempts,
            'overall_accuracy': overall_accuracy,
            'genre_stats': genre_stats,
            'daily_activity': daily_activity,
        })


class AdminCSVExportView(APIView):
    """
    管理者用CSVエクスポートAPI
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # HTTPレスポンスとしてCSVを返す
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="questions_export.csv"'
        
        # BOMを追加してExcelで正しく表示されるようにする
        response.write('\ufeff')
        
        writer = csv.writer(response)
        
        # ヘッダー行
        writer.writerow([
            'Question ID',
            'Genre ID', 
            'Genre Name',
            'Difficulty',
            'Difficulty Display',
            'Title',
            'Body',
            'Clarification',
            'Choice 1 Content',
            'Choice 1 Correct',
            'Choice 2 Content',
            'Choice 2 Correct',
            'Choice 3 Content',
            'Choice 3 Correct',
            'Choice 4 Content',
            'Choice 4 Correct',
            'Choice 5 Content',
            'Choice 5 Correct',
            'Author',
            'Created At',
            'Updated At',
            'Reviewed At',
            'Is Active'
        ])
        
        # 問題データ
        questions = Question.objects.select_related('genre', 'author_user').prefetch_related('choices').all()
        
        for question in questions:
            # 選択肢を順序順で取得
            choices = list(question.choices.order_by('order_index'))
            
            # 最大5つの選択肢をサポート
            choice_data = []
            for i in range(5):
                if i < len(choices):
                    choice_data.extend([choices[i].content, choices[i].is_correct])
                else:
                    choice_data.extend(['', ''])
            
            writer.writerow([
                question.id,
                question.genre.id,
                question.genre.name,
                question.difficulty,
                question.get_difficulty_display(),
                question.title,
                question.body,
                question.clarification,
                *choice_data,  # 選択肢データを展開
                question.author_user.username if question.author_user else '',
                question.created_at.strftime('%Y-%m-%d %H:%M:%S') if question.created_at else '',
                question.updated_at.strftime('%Y-%m-%d %H:%M:%S') if question.updated_at else '',
                question.reviewed_at.strftime('%Y-%m-%d %H:%M:%S') if question.reviewed_at else '',
                question.is_active
            ])
        
        return response


class AdminDebugDataView(APIView):
    """
    デバッグ用：データベースの実際の値を確認
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # 最初の5つの問題の実際のデータを確認
        questions = Question.objects.all()[:5]
        debug_data = []
        
        for q in questions:
            debug_data.append({
                'id': q.id,
                'title_raw': repr(q.title),
                'body_raw': repr(q.body),
                'title_value': q.title,
                'body_value': q.body,
                'title_type': type(q.title).__name__,
                'body_type': type(q.body).__name__,
                'difficulty': q.difficulty,
                'genre_id': q.genre.id if q.genre else None,
            })
        
        return Response({
            'debug_data': debug_data,
            'total_questions': Question.objects.count()
        })


class AdminCSVDeleteView(APIView):
    """
    管理者用CSV削除API
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'CSVファイルが選択されていません'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_file = request.FILES['file']
        
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'CSVファイルを選択してください'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # CSVファイルを読み込み
            decoded_file = csv_file.read().decode('utf-8-sig')  # BOM対応
            csv_data = csv.reader(io.StringIO(decoded_file))
            
            headers = next(csv_data)  # ヘッダー行をスキップ
            
            delete_summary = {
                'total_rows': 0,
                'success_count': 0,
                'error_count': 0,
                'not_found_count': 0,
                'errors': []
            }
            
            for row_index, row in enumerate(csv_data, start=2):  # 行番号は2から開始
                delete_summary['total_rows'] += 1
                
                try:
                    if len(row) < 1:
                        raise ValueError(f'行{row_index}: Question IDが必要です')
                    
                    question_id = row[0].strip()
                    
                    if not question_id:
                        raise ValueError(f'行{row_index}: Question IDが空です')
                    
                    # 問題の存在確認と削除
                    try:
                        question = Question.objects.get(id=question_id)
                        question.delete()
                        delete_summary['success_count'] += 1
                    except Question.DoesNotExist:
                        delete_summary['not_found_count'] += 1
                        delete_summary['errors'].append(f'行{row_index}: 問題 "{question_id}" が見つかりません')
                    
                except Exception as e:
                    delete_summary['error_count'] += 1
                    delete_summary['errors'].append(str(e))
            
            return Response({
                'message': 'CSV削除処理が完了しました',
                'summary': delete_summary
            })
            
        except Exception as e:
            return Response(
                {'error': f'CSVファイルの処理中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminCSVImportView(APIView):
    """
    管理者用CSVインポートAPI
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'CSVファイルが選択されていません'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_file = request.FILES['file']
        
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'CSVファイルを選択してください'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # CSVファイルを読み込み
            decoded_file = csv_file.read().decode('utf-8-sig')  # BOM対応
            csv_data = csv.reader(io.StringIO(decoded_file))
            
            headers = next(csv_data)  # ヘッダー行をスキップ
            
            import_summary = {
                'total_rows': 0,
                'success_count': 0,
                'error_count': 0,
                'errors': []
            }
            
            for row_index, row in enumerate(csv_data, start=2):  # 行番号は2から開始（ヘッダーの次）
                import_summary['total_rows'] += 1
                
                try:
                    # 必須フィールドのチェック
                    if len(row) < 17:
                        raise ValueError(f'行{row_index}: 必要な列数が不足しています（最低17列必要）')
                    
                    question_id = row[0].strip()
                    genre_id = row[1].strip()
                    # row[2] Genre Name は無視（Genre IDで紐づけ）
                    difficulty = int(row[3]) if row[3].strip() else 1
                    # row[4] Difficulty Display は無視（Difficultyで紐づけ）
                    title = row[5].strip()
                    
                    # 新規問題の場合、IDを自動生成
                    if not question_id:
                        question_id = Question.generate_next_id()
                        is_new = True
                    else:
                        is_new = False
                    
                    if not genre_id:
                        raise ValueError(f'行{row_index}: Genre IDが必要です')
                    if not title:
                        raise ValueError(f'行{row_index}: Titleが必要です')
                    
                    # ジャンルの存在確認
                    try:
                        genre = Genre.objects.get(id=genre_id)
                    except Genre.DoesNotExist:
                        raise ValueError(f'行{row_index}: ジャンル "{genre_id}" が見つかりません')
                    
                    # 問題の作成または更新
                    question, created = Question.objects.update_or_create(
                        id=question_id,
                        defaults={
                            'genre': genre,
                            'difficulty': difficulty,
                            'title': title,
                            'body': row[6].strip(),
                            'clarification': row[7].strip(),
                            'is_active': row[16].strip().lower() in ['true', '1', 'yes'] if len(row) > 16 and row[16].strip() else True
                        }
                    )
                    
                    # 既存の選択肢を削除
                    question.choices.all().delete()
                    
                    # 選択肢を作成（最大5つ）
                    choice_index = 0
                    for i in range(5):
                        choice_content_idx = 8 + (i * 2)
                        choice_correct_idx = 9 + (i * 2)
                        
                        if choice_content_idx < len(row) and row[choice_content_idx].strip():
                            is_correct = row[choice_correct_idx].strip().lower() in ['true', '1', 'yes'] if choice_correct_idx < len(row) else False
                            
                            Choice.objects.create(
                                id=Choice.generate_next_id(),
                                question=question,
                                content=row[choice_content_idx].strip(),
                                is_correct=is_correct,
                                order_index=choice_index
                            )
                            choice_index += 1
                    
                    import_summary['success_count'] += 1
                    
                except Exception as e:
                    import_summary['error_count'] += 1
                    import_summary['errors'].append(str(e))
            
            return Response({
                'message': 'CSVインポートが完了しました',
                'summary': import_summary
            })
            
        except Exception as e:
            return Response(
                {'error': f'CSVファイルの処理中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )