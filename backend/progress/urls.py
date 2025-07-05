from django.urls import path
from .views import (
    QuizSessionListCreateView, QuizSessionDetailView, UserProgressListView,
    StudyStatisticsView, GenrePerformanceView, WeeklyProgressView,
    DailyActivityView, UserAttemptListView, AssignmentListView,
    UserAssignmentListView, IncorrectQuestionsView
)

urlpatterns = [
    path('sessions/', QuizSessionListCreateView.as_view(), name='quiz_sessions'),
    path('sessions/<int:pk>/', QuizSessionDetailView.as_view(), name='quiz_session_detail'),
    path('progress/', UserProgressListView.as_view(), name='user_progress'),
    path('statistics/', StudyStatisticsView.as_view(), name='study_statistics'),
    path('genre-performance/', GenrePerformanceView.as_view(), name='genre_performance'),
    path('weekly-progress/', WeeklyProgressView.as_view(), name='weekly_progress'),
    path('daily-activity/', DailyActivityView.as_view(), name='daily_activity'),
    path('attempts/', UserAttemptListView.as_view(), name='user_attempts'),
    path('assignments/', AssignmentListView.as_view(), name='assignments'),
    path('user-assignments/', UserAssignmentListView.as_view(), name='user_assignments'),
    path('incorrect-questions/', IncorrectQuestionsView.as_view(), name='incorrect_questions'),
]