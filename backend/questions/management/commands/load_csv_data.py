# backend/management/commands/load_csv_data.py
import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
from questions.models import Genre, Question, Choice
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Load questions and answers from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-file',
            type=str,
            default='data/Cleaned_Questions_table___Answers_table______.csv',
            help='Path to CSV file'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        if not os.path.exists(csv_file):
            self.stdout.write(
                self.style.ERROR(f'CSV file not found: {csv_file}')
            )
            return

        try:
            # CSVファイルを読み込み
            df = pd.read_csv(csv_file)
            self.stdout.write(f'CSV file loaded: {len(df)} rows')
            
            # データの前処理
            df = df.dropna(subset=['question_id', 'content'])
            df = df[df['deleted_x'] == 0]  # 削除されていないデータのみ
            df = df[df['deleted_y'] == 0]
            
            # ジャンルの作成
            self.create_genres(df)
            
            # 問題と選択肢の作成
            self.create_questions_and_choices(df)
            
            self.stdout.write(
                self.style.SUCCESS('Successfully loaded CSV data')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading CSV: {str(e)}')
            )

    def create_genres(self, df):
        """ジャンルの作成"""
        genre_mapping = {
            'g02': '基礎知識',
            'g03': 'ビジネス知識',
            'g04': 'セールス知識',
            'g05': 'マーケティング知識',
            'g06': 'テクニカル知識',
        }
        
        unique_genres = df['genre_id'].unique()
        
        for genre_id in unique_genres:
            if pd.notna(genre_id):
                genre_name = genre_mapping.get(genre_id, f'ジャンル {genre_id}')
                genre, created = Genre.objects.get_or_create(
                    id=genre_id,
                    defaults={'name': genre_name}
                )
                if created:
                    self.stdout.write(f'Created genre: {genre_id} - {genre_name}')

    def create_questions_and_choices(self, df):
        """問題と選択肢の作成"""
        # 問題IDでグループ化
        question_groups = df.groupby('question_id')
        
        questions_created = 0
        choices_created = 0
        
        for question_id, group in question_groups:
            if pd.isna(question_id):
                continue
                
            # 問題の基本情報（最初の行から取得）
            first_row = group.iloc[0]
            
            # 問題の作成
            question, created = Question.objects.get_or_create(
                id=question_id,
                defaults={
                    'genre_id': first_row['genre_id'],
                    'difficulty': int(first_row['difficulty']) if pd.notna(first_row['difficulty']) else 1,
                    'point_weight': int(first_row['point_weight']) if pd.notna(first_row['point_weight']) else 1,
                    'time_weight': int(first_row['time_weight']) if pd.notna(first_row['time_weight']) else 1,
                    'title': first_row['body'] if pd.notna(first_row['body']) else '',  # CSVのbodyフィールドをtitleに
                    'body': first_row['object'] if pd.notna(first_row['object']) else '',  # CSVのobjectフィールドをbodyに
                    'clarification': first_row['clarification'] if pd.notna(first_row['clarification']) else '',
                }
            )
            
            if created:
                questions_created += 1
                self.stdout.write(f'Created question: {question_id}')
            
            # 既存の選択肢を削除（重複を避けるため）
            if not created:
                question.choices.all().delete()
            
            # 選択肢の作成
            for index, row in group.iterrows():
                if pd.notna(row['content']) and pd.notna(row['id_y']):
                    choice = Choice.objects.create(
                        id=row['id_y'],
                        question=question,
                        content=row['content'],
                        is_correct=bool(row['is_answer']),
                        order_index=index % len(group)  # 順序を設定
                    )
                    choices_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Created {questions_created} questions and {choices_created} choices'
            )
        )
