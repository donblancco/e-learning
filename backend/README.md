# E-learning System - Backend (Django)

## 概要

Django REST Framework を使用したE-learningシステムのバックエンドAPI。JWT認証、問題管理、学習進捗管理機能を提供します。

## 本番環境アクセス

- **URL**: https://your-domain.com
- **Basic認証**: user / password
- **管理者アカウント**: admin@example.com / [secure_password]
- **一般ユーザー**: user@example.com / [user_password]
- **現在のタスク定義**: elearning-system:33
- **リージョン**: ap-northeast-1 (東京)

## 技術スタック

- **Django 4.2** - Webフレームワーク
- **Django REST Framework** - API開発
- **Simple JWT** - JWT認証
- **PostgreSQL** - データベース (本番環境)
- **Redis** - キャッシュ・セッション管理
- **Gunicorn** - WSGIサーバー (本番環境)
- **Docker** - コンテナ化

## アプリケーション構成

### accounts/ - ユーザー認証
- **models.py**: カスタムユーザーモデル
- **serializers.py**: ユーザー・認証用シリアライザー
- **views.py**: 認証API (ログイン・登録・ログアウト)
- **urls.py**: 認証関連ルーティング

### questions/ - 問題管理
- **models.py**: Question, Choice, Genre モデル
- **serializers.py**: 問題・選択肢・ジャンル用シリアライザー
- **views.py**: 問題CRUD API
- **admin_views.py**: 管理者用問題管理API
- **management/commands/load_csv_data.py**: CSVデータ読み込みコマンド

### progress/ - 学習進捗
- **models.py**: UserProgress, AnswerHistory モデル
- **serializers.py**: 進捗・履歴用シリアライザー
- **views.py**: 進捗管理・統計API

### elearning/ - プロジェクト設定
- **settings/**:
  - **base.py**: 共通設定
  - **development.py**: 開発環境設定
  - **production.py**: 本番環境設定
- **urls.py**: メインルーティング
- **health_check.py**: ヘルスチェックエンドポイント

## API エンドポイント

### 認証 (`/api/auth/`)
```
POST /api/auth/login/         # ログイン
POST /api/auth/register/      # ユーザー登録
POST /api/auth/logout/        # ログアウト
POST /api/auth/refresh/       # トークンリフレッシュ
GET  /api/auth/user/          # 現在のユーザー情報
```

### ユーザー管理 (`/api/users/`)
```
GET    /api/users/           # ユーザー一覧 (管理者のみ)
GET    /api/users/{id}/      # ユーザー詳細
PUT    /api/users/{id}/      # ユーザー更新
DELETE /api/users/{id}/      # ユーザー削除 (管理者のみ)
```

### 問題管理 (`/api/questions/`)
```
GET    /api/questions/           # 問題一覧
POST   /api/questions/           # 問題作成 (管理者のみ)
GET    /api/questions/{id}/      # 問題詳細
PUT    /api/questions/{id}/      # 問題更新 (管理者のみ)
DELETE /api/questions/{id}/      # 問題削除 (管理者のみ)
GET    /api/questions/random/    # ランダム問題取得
POST   /api/questions/{id}/answer/ # 回答送信
GET    /api/questions/genres/    # ジャンル一覧
```

### 学習進捗 (`/api/progress/`)
```
GET /api/progress/              # 進捗一覧
GET /api/progress/stats/        # 統計情報
GET /api/progress/category-stats/ # カテゴリ別統計
GET /api/progress/incorrect-questions/ # 間違った問題一覧
```

### 管理者用 (`/api/admin/`)
```
GET    /api/admin/questions/     # 問題管理 (ページネーション対応)
POST   /api/admin/questions/     # 問題作成
PUT    /api/admin/questions/{id}/ # 問題更新
DELETE /api/admin/questions/{id}/ # 問題削除
GET    /api/admin/genres/        # ジャンル管理
POST   /api/admin/genres/        # ジャンル作成
GET    /api/admin/users/         # ユーザー一覧（管理者用）
GET    /api/admin/users/{id}/progress/ # 特定ユーザーの学習進捗詳細
```

### ヘルスチェック
```
GET /api/health/               # アプリケーション状態確認
```

## 開発環境セットアップ

### 1. Dockerを使用した起動
```bash
# リポジトリルートで
docker-compose up -d

# マイグレーション実行
docker exec elearning_backend python manage.py migrate

# 管理者ユーザー作成
docker exec -it elearning_backend python manage.py createsuperuser

# CSVデータ読み込み
docker exec elearning_backend python manage.py load_csv_data
```

### 2. ローカル環境での起動
```bash
# 仮想環境作成・有効化
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
export DJANGO_SETTINGS_MODULE=elearning.settings.development

# マイグレーション実行
python manage.py migrate

# 開発サーバー起動
python manage.py runserver
```

## データベース設計

### User (Django標準Userモデル拡張)
- id, username, email, password
- first_name, last_name
- is_staff, is_superuser
- date_joined, last_login

### Genre (問題ジャンル)
- id (自動採番)
- name (ジャンル名)
- description (説明)

### Question (問題)
- id (自動採番)
- object (問題文)
- genre (ジャンルへの外部キー)
- created_at, updated_at

### Choice (選択肢)
- id
- question (問題への外部キー)
- choice_text (選択肢テキスト)
- is_correct (正解フラグ)

### UserProgress (学習進捗)
- user (ユーザーへの外部キー)
- genre (ジャンルへの外部キー)
- total_questions (総問題数)
- correct_answers (正解数)
- last_studied (最終学習日)

### AnswerHistory (回答履歴)
- user (ユーザーへの外部キー)
- question (問題への外部キー)
- selected_choice (選択した選択肢)
- is_correct (正解フラグ)
- answered_at (回答日時)

## 設定ファイル

### 開発環境 (development.py)
```python
DEBUG = True
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': 'db',  # Docker Compose サービス名
        'PORT': '5432',
    }
}
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
```

### 本番環境 (production.py)
```python
DEBUG = False
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL')
    )
}
ALLOWED_HOSTS = ['*']  # ALBヘルスチェック対応
```

## 管理コマンド

### CSVデータ読み込み
```bash
python manage.py load_csv_data
```
- `data/` ディレクトリのCSVファイルから問題データを読み込み
- 既存データは重複チェックされて処理される
- ジャンルも自動的に作成される

### データベースリセット
```bash
python manage.py flush
python manage.py migrate
python manage.py load_csv_data
python manage.py createsuperuser
```

## テスト

### テスト実行
```bash
# 全テスト実行
python manage.py test

# 特定アプリのテスト
python manage.py test accounts
python manage.py test questions
python manage.py test progress
```

## 本番環境デプロイ

### Docker イメージビルド
```bash
# 本番用イメージビルド (Apple Silicon対応)
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t elearning-backend:latest .

# ECR プッシュ
AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID
docker tag elearning-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-backend:latest

# 注意: Apple Silicon (M1/M2 Mac) では必ず --platform linux/amd64 を指定してください
```

### AWS ECS デプロイ
詳細は `/deploy/README.md` を参照

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   ```bash
   # PostgreSQL接続確認
   docker exec -it elearning_db psql -U elearning_user -d elearning_db
   ```

2. **マイグレーションエラー**
   ```bash
   # マイグレーション状態確認
   python manage.py showmigrations
   
   # マイグレーションファイル作成
   python manage.py makemigrations
   ```

3. **静的ファイル問題**
   ```bash
   # 静的ファイル収集
   python manage.py collectstatic --noinput
   ```

4. **CORS エラー**
   - `settings/development.py` の `CORS_ALLOWED_ORIGINS` を確認
   - フロントエンドのURLが正しく設定されているか確認

### ログ確認

#### 開発環境
```bash
docker logs elearning_backend -f
```

#### 本番環境
```bash
# ECS ログ確認
aws logs tail /ecs/elearning-system-backend --follow --region ap-northeast-1

# 現在のタスクログストリーム取得
TASK_ID=$(aws ecs list-tasks --cluster elearning-system-cluster --service-name elearning-system-service --region ap-northeast-1 --query 'taskArns[0]' --output text | cut -d'/' -f3)
aws logs get-log-events --log-group-name "/ecs/elearning-system-backend" --log-stream-name "ecs/backend/$TASK_ID" --region ap-northeast-1

# 管理者ユーザー更新スクリプト実行
aws ecs run-task \
  --cluster elearning-system-cluster \
  --task-definition elearning-system:24 \
  --overrides '{"containerOverrides":[{"name":"backend","command":["python","/app/update_admin_user.py"]}]}' \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-YOUR_SUBNET_ID1,subnet-YOUR_SUBNET_ID2],securityGroups=[sg-YOUR_SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
  --launch-type FARGATE \
  --region ap-northeast-1
```

## セキュリティ

- **JWT認証**: アクセストークンとリフレッシュトークンの実装
- **CORS設定**: 許可されたオリジンのみアクセス可能
- **ALLOWED_HOSTS**: 本番環境では適切なホストのみ許可
- **Secrets Manager**: 機密情報は AWS Secrets Manager で管理
- **HTTPS**: 本番環境では HTTPS 必須
- **CSRF無効化**: API専用設定でCSRFを無効化（JWT認証使用のため）
- **SessionMiddleware**: 認証ミドルウェアとの互換性のため有効化

## パフォーマンス

- **Redis キャッシュ**: セッション管理とクエリキャッシュ
- **データベース最適化**: インデックス、外部キー制約
- **ページネーション**: 大量データの効率的な表示
- **静的ファイル**: S3 での配信 (オプション)

## 開発者向け情報

### コード規約
- PEP 8 準拠
- Django のベストプラクティスに従う
- API設計は RESTful 原則に基づく

### 追加機能の実装
1. 新しいアプリケーションを作成: `python manage.py startapp app_name`
2. `INSTALLED_APPS` に追加
3. モデル、シリアライザー、ビューを実装
4. URLパターンを設定
5. テストを作成
6. マイグレーション実行

## 最近解決した問題

### 2025年6月20日
1. **難易度選択機能変更**: 中級・上級を統合（フロントエンド側で実装）
2. **プラットフォーム互換性問題**: 
   - M1/M2 Mac (ARM64) でビルドしたイメージがECS Fargate (AMD64) で動作しない問題を発見
   - `docker buildx build --platform linux/amd64` を使用してクロスプラットフォームビルドで解決
3. **本番用ビルド手順の明確化**: READMEにApple Silicon環境での注意事項を追加

### 2025年6月18日
1. **全問題ランダム30問出題機能追加**: RandomQuestionsViewで全ジャンルから30問をランダム取得するAPIを提供
2. **間違った問題復習機能**: ユーザーの不正解問題を取得する `/api/progress/incorrect-questions/` エンドポイントを提供
3. **APIエンドポイント扩張**: ランダム問題取得機能を既存のRandomQuestionsViewで実装

### 2025年6月17日
1. **CORS問題解決**: CORS_ALLOWED_ORIGINSを正しいドメインに統一
2. **管理者パスワード問題**: 特殊文字を含むパスワード (Admin365!) で認証エラーが発生、password123 にリセット
3. **API URL統一**: フロントエンドが `your-domain.com` を使用するよう修正
4. **ログイン機能復旧**: フロントエンドとバックエンド両方で正常動作確認
5. **一般ユーザーアカウント**: test02@test.com / testuser02 でテスト用アカウント作成
6. **ユーザー管理API改善**: 有効アカウントのデフォルトフィルタリング機能追加
7. **統計API改善**: 新規ユーザー統計を削除し、管理者ダッシュボードを最適化

### 2025年6月16日
1. **CSRF トークンエラー**: API専用設定でCSRFを無効化し、production.py で CSRF_COOKIE_NAME=None に設定
2. **SessionMiddleware設定エラー**: django.contrib.sessions を有効化し、SessionMiddleware を base.py に追加（AuthenticationMiddlewareとの互換性のため）
3. **ログファイル作成エラー**: `/app/logs/django.log` ディレクトリが存在しないため、production.py でファイルログを無効化しコンソールログのみに変更
4. **Django admin機能無効化**: API専用アプリケーションのため、admin機能を完全に削除
5. **Missing 依存関係エラー**: requirements.txt に `dj-database-url==2.1.0` と `django-redis==5.4.0` を追加

### 重要な設定変更
- **CSRF ミドルウェア**: 無効化（JWT認証使用のため）
- **SessionMiddleware**: 有効化（AuthenticationMiddleware要求のため）
- **Django admin**: 無効化（API専用設定）
- **ログ設定**: ファイルログ → コンソールログのみ