from django.db import models
from django.contrib.auth import get_user_model
from questions.models import Question, Choice, Genre

User = get_user_model()

class UserAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE)
    is_correct = models.BooleanField()
    attempt_time = models.DateTimeField(auto_now_add=True)
    response_time_seconds = models.IntegerField(null=True, blank=True)  # 回答にかかった時間

    class Meta:
        ordering = ['-attempt_time']

    def __str__(self):
        result = "正解" if self.is_correct else "不正解"
        return f"{self.user.username} - {self.question.id} - {result}"

class QuizSession(models.Model):
    SESSION_TYPES = [
        ('random', 'ランダム'),
        ('genre', 'ジャンル別'),
        ('difficulty', '難易度別'),
        ('assignment', '課題'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES)
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True, blank=True)
    difficulty = models.IntegerField(null=True, blank=True)
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField(default=0)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

    @property
    def score_percentage(self):
        if self.total_questions == 0:
            return 0
        return round((self.correct_answers / self.total_questions) * 100, 1)

    def __str__(self):
        return f"{self.user.username} - {self.get_session_type_display()} - {self.score_percentage}%"

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)
    total_attempts = models.IntegerField(default=0)
    correct_attempts = models.IntegerField(default=0)
    last_study_date = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'genre']

    @property
    def accuracy_rate(self):
        if self.total_attempts == 0:
            return 0
        return round((self.correct_attempts / self.total_attempts) * 100, 1)

    def __str__(self):
        return f"{self.user.username} - {self.genre.name} - {self.accuracy_rate}%"

class Assignment(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    genres = models.ManyToManyField(Genre)
    difficulty_min = models.IntegerField(default=1)
    difficulty_max = models.IntegerField(default=3)
    question_count = models.IntegerField(default=10)
    due_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class UserAssignment(models.Model):
    STATUS_CHOICES = [
        ('assigned', '配信済み'),
        ('in_progress', '進行中'),
        ('completed', '完了'),
        ('overdue', '期限切れ'),
    ]
    
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ['assignment', 'user']

    def __str__(self):
        return f"{self.user.username} - {self.assignment.title} - {self.get_status_display()}"
