from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import random

from .models import Genre, Question, Choice
from .serializers import GenreSerializer, QuestionSerializer, QuestionWithoutAnswerSerializer


class GenreListView(generics.ListAPIView):
    """
    ジャンル一覧を取得するAPI
    認証不要で誰でもアクセス可能
    """
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [AllowAny]
    

class QuestionListView(generics.ListAPIView):
    """
    問題一覧を取得するAPI
    フィルタリング可能:
    - genre: ジャンルID
    - difficulty: 難易度(1,2,3)
    - is_active: アクティブな問題のみ
    """
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Question.objects.filter(is_active=True).select_related('genre', 'author_user').prefetch_related('choices')
        
        # ジャンルでフィルタリング
        genre_id = self.request.query_params.get('genre', None)
        if genre_id:
            queryset = queryset.filter(genre_id=genre_id)
            
        # 難易度でフィルタリング
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        return queryset
    

class RandomQuestionsView(APIView):
    """
    ランダムな問題を取得するAPI
    クエリパラメータ:
    - genre: ジャンルID（オプション）
    - count: 取得する問題数（デフォルト: 10）
    - difficulty: 難易度（オプション）
    - hide_answers: 正解を隠すかどうか（デフォルト: false）
    """
    permission_classes = [AllowAny]  # 開発環境用に認証を無効化
    
    def get(self, request):
        # クエリパラメータを取得
        genre_id = request.query_params.get('genre', None)
        count = int(request.query_params.get('count', 10))
        difficulty = request.query_params.get('difficulty', None)
        hide_answers = request.query_params.get('hide_answers', 'false').lower() == 'true'
        
        # 基本のクエリセット
        queryset = Question.objects.filter(is_active=True).select_related('genre', 'author_user').prefetch_related('choices')
        
        # ジャンルでフィルタリング
        if genre_id:
            queryset = queryset.filter(genre_id=genre_id)
            
        # 難易度でフィルタリング
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        # 問題IDのリストを取得
        question_ids = list(queryset.values_list('id', flat=True))
        
        # ランダムに選択
        if len(question_ids) <= count:
            selected_ids = question_ids
        else:
            selected_ids = random.sample(question_ids, count)
            
        # 選択されたIDで問題を取得
        questions = queryset.filter(id__in=selected_ids)
        
        # シリアライズして返す
        if hide_answers:
            serializer = QuestionWithoutAnswerSerializer(questions, many=True)
        else:
            serializer = QuestionSerializer(questions, many=True)
        
        return Response({
            'count': len(serializer.data),
            'questions': serializer.data
        }, status=status.HTTP_200_OK)


class QuestionDetailView(generics.RetrieveAPIView):
    """
    特定の問題の詳細を取得するAPI
    """
    queryset = Question.objects.filter(is_active=True).select_related('genre', 'author_user').prefetch_related('choices')
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    

@method_decorator(csrf_exempt, name='dispatch')
class CheckAnswerView(APIView):
    """
    問題の解答をチェックするAPI
    POSTリクエストで問題IDと選択した選択肢IDを送信
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        question_id = request.data.get('question_id')
        choice_id = request.data.get('choice_id')
        
        if not question_id or not choice_id:
            return Response({
                'error': '問題IDと選択肢IDが必要です'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            question = Question.objects.get(id=question_id, is_active=True)
            choice = question.choices.get(id=choice_id)
            
            # 正解かどうかチェック
            is_correct = choice.is_correct
            
            # 正解の選択肢を取得
            correct_choices = question.choices.filter(is_correct=True)
            
            response_data = {
                'is_correct': is_correct,
                'correct_choice_ids': list(correct_choices.values_list('id', flat=True)),
                'clarification': question.clarification if is_correct or request.data.get('show_clarification', False) else None
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Question.DoesNotExist:
            return Response({
                'error': '問題が見つかりません'
            }, status=status.HTTP_404_NOT_FOUND)
        except Choice.DoesNotExist:
            return Response({
                'error': '選択肢が見つかりません'
            }, status=status.HTTP_404_NOT_FOUND)
