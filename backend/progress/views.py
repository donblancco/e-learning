from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Sum, Q, Max
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import timedelta, datetime
from .models import UserAttempt, QuizSession, UserProgress, Assignment, UserAssignment
from .serializers import (
    UserAttemptSerializer, QuizSessionSerializer, QuizSessionCreateSerializer,
    UserProgressSerializer, StudyStatisticsSerializer, GenrePerformanceSerializer,
    WeeklyProgressSerializer, DailyActivitySerializer, AssignmentSerializer,
    UserAssignmentSerializer
)
from questions.models import Genre, Question


@method_decorator(csrf_exempt, name='dispatch')
class QuizSessionListCreateView(generics.ListCreateAPIView):
    """
    クイズセッション一覧取得・作成API
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuizSessionCreateSerializer
        return QuizSessionSerializer
    
    def get_queryset(self):
        return QuizSession.objects.filter(user=self.request.user).order_by('-start_time')


class QuizSessionDetailView(generics.RetrieveAPIView):
    """
    クイズセッション詳細取得API
    """
    serializer_class = QuizSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return QuizSession.objects.filter(user=self.request.user)


class UserProgressListView(generics.ListAPIView):
    """
    ユーザー進捗一覧取得API
    """
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user).order_by('-last_study_date')


class StudyStatisticsView(APIView):
    """
    学習統計取得API
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # 基本統計
        sessions = QuizSession.objects.filter(user=user, is_completed=True)
        total_sessions = sessions.count()
        
        if total_sessions == 0:
            return Response({
                'total_sessions': 0,
                'total_questions': 0,
                'correct_answers': 0,
                'accuracy_rate': 0,
                'average_score': 0,
                'total_study_time': 0,
                'favorite_genre': None,
                'recent_sessions': [],
                'genre_performance': []
            })
        
        total_questions = sessions.aggregate(Sum('total_questions'))['total_questions__sum'] or 0
        correct_answers = sessions.aggregate(Sum('correct_answers'))['correct_answers__sum'] or 0
        accuracy_rate = round((correct_answers / total_questions) * 100, 1) if total_questions > 0 else 0
        average_score = sessions.aggregate(Avg('correct_answers'))['correct_answers__avg'] or 0
        
        # 学習時間計算（分単位）
        completed_sessions = sessions.filter(end_time__isnull=False)
        total_study_time = 0
        for session in completed_sessions:
            if session.end_time and session.start_time:
                duration = session.end_time - session.start_time
                total_study_time += duration.total_seconds() / 60
        
        # お気に入りジャンル（最も多く学習したジャンル）
        favorite_genre_data = sessions.values('genre__id', 'genre__name').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        favorite_genre = None
        if favorite_genre_data and favorite_genre_data['genre__id']:
            try:
                favorite_genre = Genre.objects.get(id=favorite_genre_data['genre__id'])
            except Genre.DoesNotExist:
                pass
        
        # 最近のセッション（5件）
        recent_sessions = sessions.order_by('-start_time')[:5]
        
        # ジャンル別パフォーマンス
        genre_performance = UserProgress.objects.filter(user=user).order_by('-last_study_date')
        
        data = {
            'total_sessions': total_sessions,
            'total_questions': total_questions,
            'correct_answers': correct_answers,
            'accuracy_rate': accuracy_rate,
            'average_score': round(average_score, 1),
            'total_study_time': round(total_study_time),
            'favorite_genre': favorite_genre,
            'recent_sessions': recent_sessions,
            'genre_performance': genre_performance
        }
        
        serializer = StudyStatisticsSerializer(data)
        return Response(serializer.data)


class GenrePerformanceView(APIView):
    """
    ジャンル別パフォーマンス取得API
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # ジャンル別の統計を計算
        performance_data = []
        
        for progress in UserProgress.objects.filter(user=user):
            sessions = QuizSession.objects.filter(
                user=user, 
                genre=progress.genre, 
                is_completed=True
            )
            
            if sessions.exists():
                best_score = sessions.aggregate(Max('correct_answers'))['correct_answers__max'] or 0
                avg_score = sessions.aggregate(Avg('correct_answers'))['correct_answers__avg'] or 0
                
                # 学習時間計算
                total_time = 0
                for session in sessions.filter(end_time__isnull=False):
                    if session.end_time and session.start_time:
                        duration = session.end_time - session.start_time
                        total_time += duration.total_seconds() / 60
                
                last_attempt = sessions.order_by('-start_time').first().start_time
                
                performance_data.append({
                    'genre': progress.genre,
                    'sessions_count': sessions.count(),
                    'questions_count': progress.total_attempts,
                    'correct_answers': progress.correct_attempts,
                    'accuracy_rate': progress.accuracy_rate,
                    'average_score': round(avg_score, 1),
                    'best_score': best_score,
                    'total_time': round(total_time),
                    'last_attempt': last_attempt
                })
        
        serializer = GenrePerformanceSerializer(performance_data, many=True)
        return Response(serializer.data)


class WeeklyProgressView(APIView):
    """
    週別進捗取得API
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # 過去8週間のデータ
        end_date = timezone.now().date()
        start_date = end_date - timedelta(weeks=8)
        
        weekly_data = []
        current_date = start_date
        
        while current_date <= end_date:
            week_end = current_date + timedelta(days=6)
            
            sessions = QuizSession.objects.filter(
                user=user,
                is_completed=True,
                start_time__date__range=[current_date, week_end]
            )
            
            sessions_count = sessions.count()
            questions_count = sessions.aggregate(Sum('total_questions'))['total_questions__sum'] or 0
            correct_answers = sessions.aggregate(Sum('correct_answers'))['correct_answers__sum'] or 0
            accuracy_rate = round((correct_answers / questions_count) * 100, 1) if questions_count > 0 else 0
            
            # 学習時間計算
            total_time = 0
            for session in sessions.filter(end_time__isnull=False):
                if session.end_time and session.start_time:
                    duration = session.end_time - session.start_time
                    total_time += duration.total_seconds() / 60
            
            weekly_data.append({
                'week_start': current_date,
                'sessions_count': sessions_count,
                'questions_count': questions_count,
                'correct_answers': correct_answers,
                'accuracy_rate': accuracy_rate,
                'total_time': round(total_time)
            })
            
            current_date = week_end + timedelta(days=1)
        
        serializer = WeeklyProgressSerializer(weekly_data, many=True)
        return Response(serializer.data)


class DailyActivityView(APIView):
    """
    日別活動取得API
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # 過去30日間のデータ
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        daily_data = []
        current_date = start_date
        
        while current_date <= end_date:
            sessions = QuizSession.objects.filter(
                user=user,
                is_completed=True,
                start_time__date=current_date
            )
            
            sessions_count = sessions.count()
            questions_count = sessions.aggregate(Sum('total_questions'))['total_questions__sum'] or 0
            
            # 学習時間計算
            study_time = 0
            for session in sessions.filter(end_time__isnull=False):
                if session.end_time and session.start_time:
                    duration = session.end_time - session.start_time
                    study_time += duration.total_seconds() / 60
            
            daily_data.append({
                'date': current_date,
                'sessions_count': sessions_count,
                'questions_count': questions_count,
                'study_time': round(study_time)
            })
            
            current_date += timedelta(days=1)
        
        serializer = DailyActivitySerializer(daily_data, many=True)
        return Response(serializer.data)


class UserAttemptListView(generics.ListAPIView):
    """
    ユーザー回答履歴一覧取得API
    """
    serializer_class = UserAttemptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = UserAttempt.objects.filter(user=self.request.user).order_by('-attempt_time')
        
        # フィルタリング
        genre = self.request.query_params.get('genre')
        if genre:
            queryset = queryset.filter(question__genre_id=genre)
        
        is_correct = self.request.query_params.get('is_correct')
        if is_correct is not None:
            queryset = queryset.filter(is_correct=is_correct.lower() == 'true')
        
        return queryset


class AssignmentListView(generics.ListAPIView):
    """
    課題一覧取得API
    """
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Assignment.objects.filter(is_active=True).order_by('-created_at')


class UserAssignmentListView(generics.ListAPIView):
    """
    ユーザー課題一覧取得API
    """
    serializer_class = UserAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAssignment.objects.filter(user=self.request.user).order_by('-assigned_at')


class IncorrectQuestionsView(APIView):
    """
    間違った問題のみ取得API
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        limit = int(request.query_params.get('limit', 10))
        genre = request.query_params.get('genre')
        
        # 間違った問題を取得（最新の回答を基準）
        incorrect_attempts = UserAttempt.objects.filter(
            user=user,
            is_correct=False
        ).values('question_id').annotate(
            latest_attempt=Max('attempt_time')
        ).values('question_id', 'latest_attempt')
        
        # 最新の回答が間違いの問題IDを取得
        incorrect_question_ids = []
        for attempt in incorrect_attempts:
            latest_attempt = UserAttempt.objects.filter(
                user=user,
                question_id=attempt['question_id'],
                attempt_time=attempt['latest_attempt']
            ).first()
            if latest_attempt and not latest_attempt.is_correct:
                incorrect_question_ids.append(attempt['question_id'])
        
        # 問題を取得
        questions_queryset = Question.objects.filter(
            id__in=incorrect_question_ids,
            is_active=True
        )
        
        # ジャンルフィルター
        if genre:
            questions_queryset = questions_queryset.filter(genre_id=genre)
        
        # ランダムに並び替えて制限
        questions = questions_queryset.order_by('?')[:limit]
        
        # QuestionSerializerを使用してシリアライズ
        from questions.serializers import QuestionSerializer
        serializer = QuestionSerializer(questions, many=True)
        
        return Response(serializer.data)