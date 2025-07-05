from django.urls import path
from .admin_views import (
    AdminGenreListCreateView, AdminGenreDetailView,
    AdminQuestionListCreateView, AdminQuestionDetailView,
    AdminUserListView, AdminUserDetailView,
    AdminStatsView, AdminQuestionBulkActionView, AdminQuestionBulkUpdateView,
    AdminUserProgressView, AdminUserStatsView,
    AdminCSVExportView, AdminCSVImportView, AdminCSVDeleteView, AdminDebugDataView
)

urlpatterns = [
    # ジャンル管理
    path('genres/', AdminGenreListCreateView.as_view(), name='admin_genres'),
    path('genres/<str:pk>/', AdminGenreDetailView.as_view(), name='admin_genre_detail'),
    
    # 問題管理
    path('questions/', AdminQuestionListCreateView.as_view(), name='admin_questions'),
    path('questions/bulk-action/', AdminQuestionBulkActionView.as_view(), name='admin_question_bulk'),
    path('questions/bulk-update/', AdminQuestionBulkUpdateView.as_view(), name='admin_question_bulk_update'),
    path('questions/<str:pk>/', AdminQuestionDetailView.as_view(), name='admin_question_detail'),
    
    # ユーザー管理
    path('users/', AdminUserListView.as_view(), name='admin_users'),
    path('users/progress/', AdminUserProgressView.as_view(), name='admin_user_progress'),
    path('users/<int:user_id>/progress/', AdminUserProgressView.as_view(), name='admin_user_progress_detail'),
    path('users/<str:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    
    # 統計
    path('stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('stats/users/', AdminUserStatsView.as_view(), name='admin_user_stats'),
    
    # CSV エクスポート/インポート/削除
    path('csv/export/', AdminCSVExportView.as_view(), name='admin_csv_export'),
    path('csv/import/', AdminCSVImportView.as_view(), name='admin_csv_import'),
    path('csv/delete/', AdminCSVDeleteView.as_view(), name='admin_csv_delete'),
    
    # デバッグ
    path('debug/data/', AdminDebugDataView.as_view(), name='admin_debug_data'),
]