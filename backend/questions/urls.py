from django.urls import path
from .views import (
    GenreListView, 
    QuestionListView, 
    RandomQuestionsView,
    QuestionDetailView,
    CheckAnswerView
)

app_name = 'questions'

urlpatterns = [
    # ジャンル関連
    path('genres/', GenreListView.as_view(), name='genre-list'),
    
    # 問題関連
    path('questions/', QuestionListView.as_view(), name='question-list'),
    path('questions/random/', RandomQuestionsView.as_view(), name='random-questions'),
    path('questions/check-answer/', CheckAnswerView.as_view(), name='check-answer'),
    path('questions/<str:id>/', QuestionDetailView.as_view(), name='question-detail'),
]
