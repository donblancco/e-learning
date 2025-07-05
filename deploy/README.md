# AWS Production Deployment Guide

このガイドでは、E-learningシステムをAWS本番環境にデプロイする手順を説明します。

## アーキテクチャ概要

```
Internet → Route 53 → ALB → ECS Fargate → RDS PostgreSQL
                           ↓
                      ElastiCache Redis
                           ↓
                         S3 Bucket
```

## 必要なAWSサービス

- **ECS Fargate**: コンテナ実行環境
- **RDS PostgreSQL**: データベース
- **ElastiCache Redis**: キャッシュ・セッション管理
- **Application Load Balancer**: 負荷分散
- **ECR**: Dockerイメージリポジトリ
- **S3**: 静的ファイル配信
- **Route 53**: DNS管理
- **ACM**: SSL証明書
- **CloudWatch**: 監視・ログ

## デプロイ手順

### 1. 事前準備

```bash
# AWS CLIの設定
aws configure

# AWSアカウントIDを確認
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: ${AWS_ACCOUNT_ID}"
```

### 2. 環境変数の準備

```bash
# 環境変数ファイルをコピーして編集
cp .env.production.example .env.production
# .env.production を編集して必要な値を設定
```

#### 環境変数の詳細説明

**.env.production** ファイルに設定する環境変数：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| **DB_PASSWORD** | RDS PostgreSQLのパスワード（必須） | `SecurePassword123!` |
| **DB_USERNAME** | RDS PostgreSQLのユーザー名 | `elearning_admin` |
| **DB_NAME** | データベース名 | `elearning_db` |
| **AWS_REGION** | AWSリージョン | `ap-northeast-1` |
| **AWS_ACCOUNT_ID** | AWSアカウントID（12桁） | `123456789012` |
| **DJANGO_SECRET_KEY** | Djangoシークレットキー（必須） | ランダムな50文字以上の文字列 |
| **ALLOWED_HOSTS** | 許可するホスト名（必須） | `example.com,*.example.com` |
| **REDIS_PASSWORD** | ElastiCache Redisのパスワード | `RedisPassword123!` |
| **SENTRY_DSN** | エラー監視用（オプション） | Sentryから取得したDSN |
| **AWS_ACCESS_KEY_ID** | S3アクセス用（オプション） | IAMユーザーのアクセスキー |
| **AWS_SECRET_ACCESS_KEY** | S3アクセス用（オプション） | IAMユーザーのシークレットキー |
| **AWS_STORAGE_BUCKET_NAME** | 静的ファイル用S3バケット名 | `elearning-static-files` |

**重要な注意事項：**
- `DB_PASSWORD`: 8文字以上で、大文字・小文字・数字・記号を含む強力なパスワードを設定
- `DJANGO_SECRET_KEY`: [Django Secret Key Generator](https://djecrety.ir/)などで生成した安全なキーを使用
- `.env.production`ファイルは絶対にGitにコミットしないこと（.gitignoreに登録済み）

### 3. インフラストラクチャのデプロイ

**重要**: 新しいCloudFormationテンプレートでは、以下のリソースが自動的に作成されます：
- IAMロール（ECS Task Execution Role、ECS Task Role）
- ECRリポジトリ（バックエンド・フロントエンド）
- CloudWatchログスグループ
- AWS Secrets Manager（データベース接続情報、Django秘密鍵、Redis接続情報）

```bash
# CloudFormationで全インフラを一括作成（.env.productionから自動的に環境変数を読み込み）
cd deploy/
./deploy-with-env.sh stack

# スタック作成完了の確認
aws cloudformation describe-stacks \
    --stack-name elearning-system-infrastructure \
    --region ap-northeast-1 \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table
```

### 4. Dockerイメージの準備

#### 4.1 Dockerイメージのビルドとプッシュ
```bash
# AWSアカウントIDを取得（CloudFormationの出力からも取得可能）
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | \
    docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com

# バックエンドイメージのビルドとプッシュ
cd ../backend/
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t elearning-system-backend:latest .
docker tag elearning-system-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-backend:latest

# フロントエンドイメージのビルドとプッシュ
cd ../frontend/
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t elearning-system-frontend:latest .
docker tag elearning-system-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-frontend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/elearning-system-frontend:latest

# 注意: Apple Silicon (M1/M2 Mac) では必ず --platform linux/amd64 を指定してください
```

### 5. ECSタスク定義の登録

```bash
# タスク定義ファイルのアカウントIDを更新
cd ../deploy/
perl -i -pe "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" aws-ecs-task-definition.json

# タスク定義を登録
aws ecs register-task-definition \
    --cli-input-json file://aws-ecs-task-definition.json \
    --region ap-northeast-1
```

### 6. ECSサービスのデプロイ

```bash
# deploy.shスクリプトでECSサービスを作成（推奨）
./deploy.sh

# または手動でサービス作成
# CloudFormationスタックからネットワーク情報を取得
SUBNET_ID1=$(aws cloudformation describe-stack-resources \
    --stack-name elearning-system-infrastructure \
    --region ap-northeast-1 \
    --query 'StackResources[?LogicalResourceId==`PublicSubnet1`].PhysicalResourceId' \
    --output text)

SUBNET_ID2=$(aws cloudformation describe-stack-resources \
    --stack-name elearning-system-infrastructure \
    --region ap-northeast-1 \
    --query 'StackResources[?LogicalResourceId==`PublicSubnet2`].PhysicalResourceId' \
    --output text)

SECURITY_GROUP_ID=$(aws cloudformation describe-stack-resources \
    --stack-name elearning-system-infrastructure \
    --region ap-northeast-1 \
    --query 'StackResources[?LogicalResourceId==`ECSSecurityGroup`].PhysicalResourceId' \
    --output text)

# ターゲットグループARNを取得
BACKEND_TARGET_GROUP_ARN=$(aws cloudformation describe-stack-resources \
    --stack-name elearning-system-infrastructure \
    --region ap-northeast-1 \
    --query 'StackResources[?LogicalResourceId==`BackendTargetGroup`].PhysicalResourceId' \
    --output text)

FRONTEND_TARGET_GROUP_ARN=$(aws cloudformation describe-stack-resources \
    --stack-name elearning-system-infrastructure \
    --region ap-northeast-1 \
    --query 'StackResources[?LogicalResourceId==`FrontendTargetGroup`].PhysicalResourceId' \
    --output text)

# ECSサービスを作成
aws ecs create-service \
    --cluster elearning-system-cluster \
    --service-name elearning-system-service \
    --task-definition elearning-system \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID1},${SUBNET_ID2}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
    --load-balancers "[{\"targetGroupArn\":\"${BACKEND_TARGET_GROUP_ARN}\",\"containerName\":\"backend\",\"containerPort\":8000},{\"targetGroupArn\":\"${FRONTEND_TARGET_GROUP_ARN}\",\"containerName\":\"frontend\",\"containerPort\":80}]" \
    --region ap-northeast-1
```

### 7. データベース初期化

```bash
# ECSタスクで初期マイグレーションを実行
aws ecs run-task \
    --cluster elearning-system-cluster \
    --task-definition elearning-system \
    --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","migrate"]}]}' \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID1}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
    --launch-type FARGATE \
    --region ap-northeast-1

# 管理者ユーザー更新スクリプト実行
aws ecs run-task \
    --cluster elearning-system-cluster \
    --task-definition elearning-system:33 \
    --overrides '{"containerOverrides":[{"name":"backend","command":["python","/app/update_admin_user.py"]}]}' \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-YOUR_SUBNET_ID1,subnet-YOUR_SUBNET_ID2],securityGroups=[sg-YOUR_SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
    --launch-type FARGATE \
    --region ap-northeast-1

# CSVデータを投入
aws ecs run-task \
    --cluster elearning-system-cluster \
    --task-definition elearning-system:24 \
    --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","load_csv_data"]}]}' \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-YOUR_SUBNET_ID1,subnet-YOUR_SUBNET_ID2],securityGroups=[sg-YOUR_SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
    --launch-type FARGATE \
    --region ap-northeast-1
```

## 現在のデプロイ状態

### 本番環境情報
- **URL**: https://your-domain.com
- **Basic認証**: user / password
- **ALB DNS**: YOUR-ALB-DNS-NAME.region.elb.amazonaws.com
- **管理者アカウント**: admin@example.com / [secure_password]
- **一般ユーザー**: user@example.com / [user_password]
- **ECS クラスター**: elearning-system-cluster
- **ECS サービス**: elearning-system-service
- **現在のタスク定義**: elearning-system:33
- **リージョン**: ap-northeast-1 (東京)

### ヘルスチェック確認
```bash
# バックエンドヘルスチェック
aws elbv2 describe-target-health --target-group-arn $(aws elbv2 describe-target-groups --names elearning-system-backend-tg --region ap-northeast-1 --query 'TargetGroups[0].TargetGroupArn' --output text) --region ap-northeast-1

# フロントエンドヘルスチェック
aws elbv2 describe-target-health --target-group-arn $(aws elbv2 describe-target-groups --names elearning-system-frontend-tg --region ap-northeast-1 --query 'TargetGroups[0].TargetGroupArn' --output text) --region ap-northeast-1
```

### 8. オプション設定

#### DNS設定（Route 53）
```bash
# ホストゾーンを作成
aws route53 create-hosted-zone --name your-domain.com --caller-reference $(date +%s)

# ALBをポイントするAレコードを作成
```

#### SSL証明書（AWS Certificate Manager）
```bash
# 証明書をリクエスト
aws acm request-certificate \
    --domain-name your-domain.com \
    --subject-alternative-names www.your-domain.com \
    --validation-method DNS
```

## 運用管理

### 監視設定

CloudWatchで以下のメトリクスを監視:
- ECSタスクのCPU/メモリ使用率
- RDSの接続数・クエリ性能
- ALBのレスポンス時間・エラー率

### ログ管理

```bash
# アプリケーションログの確認
aws logs tail /ecs/elearning-system-backend --follow

# Nginxアクセスログの確認
aws logs tail /ecs/elearning-system-frontend --follow
```

### スケーリング

```bash
# ECSサービスのタスク数を変更
aws ecs update-service \
    --cluster elearning-system-cluster \
    --service elearning-system-service \
    --desired-count 3
```

### バックアップ

- RDS: 自動バックアップが7日間保持
- S3: バージョニング有効

### デプロイスクリプトの使い分け

| スクリプト | 用途 | 実行内容 |
|-----------|------|----------|
| `./deploy-with-env.sh stack` | **インフラのみデプロイ** | CloudFormationでインフラ構築・更新のみ<br/>- IAMロール、ECRリポジトリ、RDS、Redis、VPC等の作成・更新<br/>- `.env.production`から環境変数を自動読み込み<br/>- AWS Secrets Managerの値を自動更新 |
| `./deploy.sh` | **フルデプロイメント** | 完全なアプリケーションデプロイ<br/>- ECRリポジトリ作成<br/>- Dockerイメージビルド・プッシュ<br/>- CloudFormationでインフラ構築<br/>- ECSタスク定義登録<br/>- ECSサービスデプロイ |

### アップデート手順

```bash
# 1. 初回セットアップ
./deploy-with-env.sh stack  # インフラ作成
# 手動でDockerイメージビルド・プッシュ、ECSタスク定義登録

# 2. インフラ設定変更のみ（RDS設定、VPC設定、環境変数変更など）
./deploy-with-env.sh stack

# 3. アプリケーションコード更新のみ
./deploy.sh

# 4. 環境変数の変更（.env.production更新後）
./deploy-with-env.sh stack
```

## セキュリティ考慮事項

1. **IAMロール**: 最小権限の原則
2. **セキュリティグループ**: 必要最小限のポート開放
3. **暗号化**: RDS・EBS・S3すべて暗号化済み
4. **秘密情報**: AWS Secrets Managerで管理
5. **SSL/TLS**: ALBでSSL終端

## ヘルスチェック設定

### 現在の設定（最適化済み）

#### ALB ターゲットグループ
- **バックエンド**: 60秒間隔、30秒タイムアウト、2回成功で健全、5回失敗で異常
- **フロントエンド**: 30秒間隔、10秒タイムアウト、2回成功で健全、5回失敗で異常

#### ECS タスク定義
- **バックエンド**: 60秒間隔、30秒タイムアウト、5回リトライ、120秒起動猶予
- **フロントエンド**: 30秒間隔、10秒タイムアウト、5回リトライ、60秒起動猶予

### ヘルスチェック設定変更コマンド
```bash
# ALB ターゲットグループのヘルスチェック設定変更（バックエンド）
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-1:YOUR_ACCOUNT_ID:targetgroup/elearning-system-backend-tg/YOUR_TG_ID \
  --health-check-interval-seconds 60 \
  --health-check-timeout-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 5 \
  --region ap-northeast-1

# ALB ターゲットグループのヘルスチェック設定変更（フロントエンド）
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-1:YOUR_ACCOUNT_ID:targetgroup/elearning-system-frontend-tg/YOUR_TG_ID \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 10 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 5 \
  --region ap-northeast-1
```

## デプロイメント設定

### サーキットブレーカー
- **有効**: 自動ロールバック機能
- **最大パーセンテージ**: 200%
- **最小健全パーセンテージ**: 50%

```bash
# デプロイメント設定更新
aws ecs update-service \
  --cluster elearning-system-cluster \
  --service elearning-system-service \
  --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=50" \
  --region ap-northeast-1
```

## 最近の更新内容

### 2025年6月20日
1. **ECSタスク再起動問題の解決**:
   - プラットフォームアーキテクチャ不一致を発見（M1 Mac ARM64 → ECS Fargate AMD64）
   - `docker buildx build --platform linux/amd64` を使用してAMD64用イメージをビルド
   - エラー: `image Manifest does not contain descriptor matching platform 'linux/amd64'` を解決
2. **nginx設定修正**:
   - `.htpasswd` ファイル作成エラーを修正
   - Dockerfile.simpleで `mkdir -p /etc/nginx` を追加してディレクトリを確実に作成
3. **ドキュメント更新**:
   - Apple Silicon環境でのビルド手順を明確化
   - 全READMEファイルに `docker buildx` の使用を推奨

### 2025年6月18日
1. **全問題ランダム30問出題機能追加**: ジャンル選択画面に「🎲 全問題から30問ランダム」ボタンを追加
2. **間違った問題の隣にランダム出題ボタン配置**: 結果画面で間違った問題（❌）の隣に小さな「🎲 ランダム30問」ボタンを配置
3. **管理者画面「戻る」ボタンの視認性改善**: AdminPanelの「戻る」ボタンに背景色とホバー効果を追加、全デバイスで「戻る」テキストを表示
4. **システム全体バックアップ作成**: backup-20250618-000313

### 2025年6月17日
1. **CORS問題解決**: フロントエンドとバックエンド間のCORS設定修正
2. **ドメイン統一**: API URLを `your-domain.com` に統一
3. **管理者パスワード修正**: 特殊文字問題により管理者パスワードを `password123` に変更
4. **フロントエンドビルド修正**: 環境変数が正しく反映されるよう `deploy.sh` に `--build-arg REACT_APP_API_URL` を追加
5. **ECSサービス強制再デプロイ**: `--force-new-deployment` フラグでタスク定義 `elearning-system:33` に更新
6. **本番ログイン機能復旧**: フロントエンドとバックエンド両方でログイン正常動作確認
7. **一般ユーザーアカウント追加**: test02@test.com / testuser02 でテスト用アカウント作成
8. **モバイルレスポンシブUI実装**: ヘッダーメニューとAdminPanelのモバイル最適化
9. **システム全体バックアップ作成**: backup-20250617-231809 でRDS・Docker・Gitタグバックアップ完了

## 最近解決した問題

### 2025年6月16日
1. **CSRF トークンエラー**: CSRF ミドルウェアを無効化し、production.py で CSRF_COOKIE_NAME=None に設定
2. **SessionMiddleware設定エラー**: django.contrib.sessions を有効化し、SessionMiddleware を base.py に追加
3. **Docker プラットフォーム互換性エラー**: `docker build --platform linux/amd64` でプラットフォーム指定してビルド
4. **ログファイル作成エラー**: production.py でファイルログを無効化し、コンソールログのみに変更
5. **ECS タスクの頻繁な再起動**: ALB とタスク定義のヘルスチェック設定を緩和
6. **Missing 依存関係エラー**: requirements.txt に dj-database-url と django-redis を追加

## トラブルシューティング

### よくある問題

1. **ECSタスクが起動しない**
   ```bash
   aws ecs describe-tasks --cluster elearning-system-cluster --tasks TASK_ID
   ```

2. **データベース接続エラー**
   - セキュリティグループの設定確認
   - 環境変数の確認

3. **ロードバランサーのヘルスチェック失敗**
   - アプリケーションの起動状態確認
   - ヘルスチェックパスの確認

### サポート

- CloudWatchログで詳細なエラー情報を確認
- AWS Supportケースの作成
- Sentryでアプリケーションエラーの追跡

## コスト最適化

1. **リザーブドインスタンス**: RDSとElastiCache
2. **スポットインスタンス**: 開発環境では利用可能
3. **Auto Scaling**: 需要に応じたスケーリング
4. **S3ライフサイクル**: 古いログの自動削除

## よくある質問（FAQ）

### Q: `.env.production`ファイルを間違って削除してしまいました
A: `.env.production.example`から再度コピーして、必要な値を設定し直してください。

### Q: データベースパスワードを変更したい
A: 
1. `.env.production`ファイルの`DB_PASSWORD`を更新
2. AWS Secrets Managerの値も更新
3. `./deploy-with-env.sh stack`で再デプロイ

### Q: CloudFormationスタックの作成に失敗しました
A: 
- AWSアカウントIDが正しく設定されているか確認
- 必要なIAM権限があるか確認
- リージョンが正しく設定されているか確認

### Q: ECSタスクが起動しません
A:
1. CloudWatchログでエラーを確認
2. Secrets Managerの値が正しく設定されているか確認
3. セキュリティグループの設定を確認
4. ネットワーク設定（サブネット・セキュリティグループ）が正しく指定されているか確認

### Q: ALBにアクセスできません
A:
1. ALBリスナーが正しく設定されているか確認
2. ターゲットグループのヘルスチェックが成功しているか確認
3. セキュリティグループでHTTP/HTTPSポートが開放されているか確認

### Q: バックエンドのヘルスチェックが失敗します
A:
1. DjangoのALLOWED_HOSTSにlocalhostとVPCのIPアドレスが含まれているか確認
2. `/api/health/`エンドポイントが正常に動作しているか確認
3. ECSタスクのログでエラーメッセージを確認

### Q: "Network Configuration must be provided" エラーが発生します
A: Fargateタスクには必ずネットワーク設定が必要です：
```bash
--network-configuration "awsvpcConfiguration={subnets=[SUBNET_ID],securityGroups=[SG_ID],assignPublicIp=ENABLED}"
```

## 注意事項

- 本番デプロイ前に必ずステージング環境でテスト
- データベースバックアップの確認
- ドメイン設定とSSL証明書の準備
- 負荷テストの実行
- `.env.production`ファイルは機密情報を含むため、適切に管理すること