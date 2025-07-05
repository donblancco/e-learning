from django.db import models
from django.contrib.auth import get_user_model
import re

User = get_user_model()

class Genre(models.Model):
    id = models.CharField(max_length=10, primary_key=True)  # g02, g03, etc.
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.name}"
    
    @classmethod
    def generate_next_id(cls):
        """次のジャンルIDを生成する (g01, g02, g03...)"""
        # 現在の最大IDを取得
        last_genre = cls.objects.filter(id__regex=r'^g\d+$').order_by('-id').first()
        
        if not last_genre:
            return 'g01'
        
        # IDから数値部分を抽出
        match = re.match(r'^g(\d+)$', last_genre.id)
        if match:
            next_number = int(match.group(1)) + 1
            return f'g{next_number:02d}'  # 2桁でゼロパディング（g01, g02... g99, g100...）
        
        return 'g01'  # フォールバック

class Question(models.Model):
    DIFFICULTY_CHOICES = [
        (1, '初級'),
        (2, '中級'),
        (3, '上級'),
    ]
    
    id = models.CharField(max_length=20, primary_key=True)  # QFB00001, etc.
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE, related_name='questions')
    difficulty = models.IntegerField(choices=DIFFICULTY_CHOICES)
    title = models.TextField()  # タイトル（旧body）
    body = models.TextField(blank=True)  # 問題文（旧object）
    clarification = models.TextField(blank=True)  # 解説
    author_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='authored_questions')
    modified_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='modified_questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)  # レビュー完了日
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.id} - {self.title[:50]}..."
    
    @classmethod
    def generate_next_id(cls):
        """次の問題IDを生成する (QFB00001, QFB00002...)"""
        # QFBで始まるIDの中で最大のものを取得
        last_question = cls.objects.filter(id__startswith='QFB').order_by('-id').first()
        
        if not last_question:
            return 'QFB00001'
        
        # IDから数値部分を抽出
        match = re.match(r'^QFB(\d+)$', last_question.id)
        if match:
            next_number = int(match.group(1)) + 1
            return f'QFB{next_number:05d}'  # 5桁でゼロパディング
        
        # 既存のIDがパターンに合わない場合は、全てのIDから最大値を探す
        all_questions = cls.objects.all().order_by('-id')
        for q in all_questions:
            match = re.match(r'^QFB(\d+)$', q.id)
            if match:
                next_number = int(match.group(1)) + 1
                return f'QFB{next_number:05d}'
        
        return 'QFB00001'  # フォールバック

class Choice(models.Model):
    id = models.CharField(max_length=50, primary_key=True)  # a000000077, etc. (サイズ拡張)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    content = models.TextField()  # 選択肢の内容
    is_correct = models.BooleanField(default=False)
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        marker = "◯" if self.is_correct else "×"
        return f"{self.question.id} - {self.content[:30]}... {marker}"
    
    @classmethod
    def generate_next_id(cls):
        """次の選択肢IDを生成する (a000000001, a000000002...)"""
        # 'a'で始まるIDの中で最大のものを取得
        last_choice = cls.objects.filter(id__startswith='a').order_by('-id').first()
        
        if not last_choice:
            return 'a000000001'
        
        # IDから数値部分を抽出
        match = re.match(r'^a(\d+)$', last_choice.id)
        if match:
            next_number = int(match.group(1)) + 1
            return f'a{next_number:09d}'  # 9桁でゼロパディング
        
        return 'a000000001'  # フォールバック
