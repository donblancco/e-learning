from rest_framework import serializers
from .models import Genre, Question, Choice


class GenreSerializer(serializers.ModelSerializer):
    """ジャンルのシリアライザー"""
    id = serializers.CharField(required=False, allow_blank=True)  # IDをオプショナルに
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    
    class Meta:
        model = Genre
        fields = ['id', 'name', 'description', 'question_count', 'created_at']
        read_only_fields = ['created_at']


class ChoiceSerializer(serializers.ModelSerializer):
    """選択肢のシリアライザー"""
    id = serializers.CharField(required=False, allow_blank=True)  # IDをオプショナルに
    
    class Meta:
        model = Choice
        fields = ['id', 'content', 'is_correct', 'order_index']


class ChoiceWithoutAnswerSerializer(serializers.ModelSerializer):
    """選択肢のシリアライザー（正解情報なし）"""
    class Meta:
        model = Choice
        fields = ['id', 'content', 'order_index']
        

class QuestionSerializer(serializers.ModelSerializer):
    """問題のシリアライザー"""
    id = serializers.CharField(required=False, allow_blank=True)  # IDをオプショナルに
    choices = ChoiceSerializer(many=True, read_only=True)
    genre_name = serializers.CharField(source='genre.name', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    author_name = serializers.CharField(source='author_user.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'genre', 'genre_name', 'difficulty', 'difficulty_display',
            'title', 'body', 'clarification',
            'choices', 'author_name', 'created_at', 'updated_at', 'reviewed_at', 'is_active'
        ]
        read_only_fields = ['created_at', 'updated_at']


class QuestionWithoutAnswerSerializer(serializers.ModelSerializer):
    """問題のシリアライザー（正解情報なし - クイズ用）"""
    choices = ChoiceWithoutAnswerSerializer(many=True, read_only=True)
    genre_name = serializers.CharField(source='genre.name', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'genre', 'genre_name', 'difficulty', 'difficulty_display',
            'title', 'body',
            'choices', 'created_at', 'is_active'
        ]
        read_only_fields = ['created_at']
