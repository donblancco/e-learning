from rest_framework import serializers
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import timedelta
from .models import UserAttempt, QuizSession, UserProgress, Assignment, UserAssignment
from questions.serializers import GenreSerializer, QuestionSerializer
from accounts.serializers import UserSerializer


class UserAttemptSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.body', read_only=True)
    choice_text = serializers.CharField(source='selected_choice.content', read_only=True)
    correct_choice_text = serializers.SerializerMethodField()
    genre_name = serializers.CharField(source='question.genre.name', read_only=True)

    class Meta:
        model = UserAttempt
        fields = ['id', 'question', 'question_text', 'selected_choice', 'choice_text', 
                 'correct_choice_text', 'is_correct', 'attempt_time', 'response_time_seconds',
                 'genre_name']

    def get_correct_choice_text(self, obj):
        correct_choice = obj.question.choices.filter(is_correct=True).first()
        return correct_choice.content if correct_choice else None


class QuizSessionSerializer(serializers.ModelSerializer):
    genre_name = serializers.CharField(source='genre.name', read_only=True)
    score_percentage = serializers.ReadOnlyField()
    duration_minutes = serializers.SerializerMethodField()
    attempts = UserAttemptSerializer(many=True, read_only=True, source='user.attempts')

    class Meta:
        model = QuizSession
        fields = ['id', 'session_type', 'genre', 'genre_name', 'difficulty', 
                 'total_questions', 'correct_answers', 'score_percentage',
                 'start_time', 'end_time', 'is_completed', 'duration_minutes', 'attempts']

    def get_duration_minutes(self, obj):
        if obj.end_time and obj.start_time:
            duration = obj.end_time - obj.start_time
            return round(duration.total_seconds() / 60, 1)
        return None


class QuizSessionCreateSerializer(serializers.ModelSerializer):
    answers = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )

    class Meta:
        model = QuizSession
        fields = ['session_type', 'genre', 'difficulty', 'total_questions', 'answers']

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        user = self.context['request'].user
        
        # クイズセッションを作成
        quiz_session = QuizSession.objects.create(
            user=user,
            **validated_data
        )
        
        correct_count = 0
        
        # 各回答を処理
        for answer_data in answers_data:
            attempt = UserAttempt.objects.create(
                user=user,
                question_id=answer_data['question_id'],
                selected_choice_id=answer_data['selected_choice_id'],
                is_correct=answer_data['is_correct'],
                response_time_seconds=answer_data.get('response_time_seconds')
            )
            
            if attempt.is_correct:
                correct_count += 1
        
        # セッション結果を更新
        quiz_session.correct_answers = correct_count
        quiz_session.end_time = timezone.now()
        quiz_session.is_completed = True
        quiz_session.save()
        
        # ユーザー進捗を更新
        if quiz_session.genre:
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                genre=quiz_session.genre,
                defaults={
                    'total_attempts': validated_data['total_questions'],
                    'correct_attempts': correct_count
                }
            )
            if not created:
                progress.total_attempts += validated_data['total_questions']
                progress.correct_attempts += correct_count
                progress.save()
        
        return quiz_session


class UserProgressSerializer(serializers.ModelSerializer):
    genre = GenreSerializer(read_only=True)
    accuracy_rate = serializers.ReadOnlyField()

    class Meta:
        model = UserProgress
        fields = ['id', 'genre', 'total_attempts', 'correct_attempts', 
                 'accuracy_rate', 'last_study_date', 'created_at']


class StudyStatisticsSerializer(serializers.Serializer):
    total_sessions = serializers.IntegerField()
    total_questions = serializers.IntegerField()
    correct_answers = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()
    average_score = serializers.FloatField()
    total_study_time = serializers.IntegerField()
    favorite_genre = GenreSerializer()
    recent_sessions = QuizSessionSerializer(many=True)
    genre_performance = UserProgressSerializer(many=True)


class GenrePerformanceSerializer(serializers.Serializer):
    genre = GenreSerializer()
    sessions_count = serializers.IntegerField()
    questions_count = serializers.IntegerField()
    correct_answers = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()
    average_score = serializers.FloatField()
    best_score = serializers.FloatField()
    total_time = serializers.IntegerField()
    last_attempt = serializers.DateTimeField()


class WeeklyProgressSerializer(serializers.Serializer):
    week_start = serializers.DateField()
    sessions_count = serializers.IntegerField()
    questions_count = serializers.IntegerField()
    correct_answers = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()
    total_time = serializers.IntegerField()


class DailyActivitySerializer(serializers.Serializer):
    date = serializers.DateField()
    sessions_count = serializers.IntegerField()
    questions_count = serializers.IntegerField()
    study_time = serializers.IntegerField()


class AssignmentSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'genres', 'difficulty_min', 
                 'difficulty_max', 'question_count', 'due_date', 'created_by', 
                 'created_at', 'is_active']


class UserAssignmentSerializer(serializers.ModelSerializer):
    assignment = AssignmentSerializer(read_only=True)

    class Meta:
        model = UserAssignment
        fields = ['id', 'assignment', 'status', 'assigned_at', 'started_at', 
                 'completed_at', 'score']