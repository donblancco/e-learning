# E-Learning System 📚

> フルスタック学習管理システム - Django + React で構築した本格的なWebアプリケーション

[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat&logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![AWS](https://img.shields.io/badge/AWS-ECS_Fargate-FF9900?style=flat&logo=amazonaws)](https://aws.amazon.com/)

## 🎯 プロジェクト概要

このプロジェクトは、モダンなWeb技術を活用して構築した学習管理システム（LMS）です。ユーザー認証、問題演習、学習進捗管理、管理者機能を含む包括的なE-learningプラットフォームを提供します。

### ✨ 主な特徴

- 🔐 **JWT認証システム** - セキュアなユーザー認証
- 📝 **問題演習機能** - 選択式問題によるクイズシステム
- 📊 **学習進捗管理** - 詳細な学習データと統計
- 👨‍💼 **管理者ダッシュボード** - ユーザー・問題・進捗管理
- 📱 **レスポンシブデザイン** - モバイル・タブレット完全対応
- 🚀 **本番環境対応** - AWS ECSによるスケーラブルなデプロイ

## 🏗️ システム構成

### 開発環境アーキテクチャ
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Django)      │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Cache)       │
                       │   Port: 6379    │
                       └─────────────────┘
```

### 本番環境 (AWS)
```
Internet → Route 53 → ALB → ECS Fargate → RDS PostgreSQL
                           ↓
                      ElastiCache Redis
                           ↓
                         S3 Bucket
```

## 💻 技術スタック

### バックエンド
- **Django 4.2** - Webフレームワーク
- **Django REST Framework** - REST API開発
- **Simple JWT** - JWT認証
- **PostgreSQL** - メインデータベース
- **Redis** - キャッシュ・セッション管理
- **Gunicorn** - WSGIサーバー

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Material-UI (MUI)** - UIコンポーネント
- **Redux Toolkit** - 状態管理
- **Recharts** - データ可視化
- **Axios** - HTTP通信

### インフラ・DevOps
- **Docker & Docker Compose** - コンテナ化
- **AWS ECS Fargate** - コンテナオーケストレーション
- **AWS RDS** - マネージドデータベース
- **AWS ALB** - ロードバランサー
- **CloudFormation** - Infrastructure as Code

## 🚀 クイックスタート

### 前提条件
- Docker Desktop
- Git

### 1. リポジトリのクローン
```bash
git clone https://github.com/username/elearning-system.git
cd elearning-system
```

### 2. 開発環境の起動
```bash
# Docker環境の構築と起動
docker-compose up --build -d

# データベースの初期化
docker exec elearning_backend python manage.py migrate

# 管理者ユーザーの作成
docker exec -it elearning_backend python manage.py createsuperuser

# サンプルデータの読み込み
docker exec elearning_backend python manage.py load_csv_data
```

### 3. アプリケーションへのアクセス
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **Django管理画面**: http://localhost:8000/admin

## 📁 プロジェクト構成

```
elearning-system/
├── backend/                 # Django バックエンド
│   ├── accounts/           # ユーザー認証
│   ├── questions/          # 問題管理
│   ├── progress/           # 学習進捗
│   └── elearning/          # プロジェクト設定
├── frontend/               # React フロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── services/       # API通信
│   │   ├── contexts/       # React Context
│   │   └── types/          # TypeScript型定義
├── deploy/                 # AWS デプロイ設定
└── docker-compose.yml      # 開発環境設定
```

## 🎮 主な機能

### 👤 ユーザー機能
- **認証システム**: ログイン・登録・JWT認証
- **問題演習**: ジャンル別・難易度別クイズ
- **学習進捗**: 統計情報・履歴・成績管理
- **ランダム出題**: 全問題からランダム30問

### 👨‍💼 管理者機能
- **問題管理**: CRUD操作・CSV一括インポート
- **ユーザー管理**: アカウント管理・権限設定
- **進捗監視**: 全ユーザーの学習状況把握
- **統計ダッシュボード**: 学習データ分析

### 📱 UI/UX
- **レスポンシブデザイン**: 全デバイス対応
- **Material Design**: モダンなUI
- **リアルタイム更新**: 進捗の即座反映
- **アクセシビリティ**: ARIA対応

## 🔧 開発・運用

### 開発環境での作業
```bash
# 開発サーバーの起動
docker-compose up

# データベースのリセット
docker-compose down -v
docker-compose up --build

# ログの確認
docker logs elearning_backend -f
```

### テスト実行
```bash
# バックエンドテスト
docker exec elearning_backend python manage.py test

# フロントエンドテスト
docker exec elearning_frontend npm test
```

## 🌟 技術的ハイライト

### アーキテクチャの特徴
- **マイクロサービス設計**: フロントエンド・バックエンド分離
- **RESTful API**: Django REST Frameworkによる標準的API設計
- **JWT認証**: ステートレスでスケーラブルな認証
- **Docker化**: 環境の一貫性と可搬性

### パフォーマンス最適化
- **Redis キャッシュ**: セッション管理とクエリ高速化
- **データベース最適化**: インデックス最適化・N+1問題対策
- **フロントエンド**: React.memo・useMemo による最適化
- **コード分割**: 遅延ローディングによる初期表示高速化

### セキュリティ対策
- **CORS設定**: 適切なオリジン制限
- **HTTPS必須**: 本番環境での暗号化通信
- **入力値検証**: フロント・バック両方での検証
- **SQL Injection対策**: ORMによる安全なクエリ

## 🚀 本番環境デプロイ

本プロジェクトはAWS ECS Fargate上での本番運用を想定して設計されています。

### インフラ構成
- **ECS Fargate**: コンテナの実行環境
- **RDS PostgreSQL**: マネージドデータベース
- **ElastiCache Redis**: マネージドキャッシュ
- **Application Load Balancer**: 負荷分散
- **CloudFormation**: Infrastructure as Code

### デプロイ手順
詳細な本番デプロイ手順は `/deploy/README.md` を参照してください。

## 🤝 開発方針

### コード品質
- **型安全性**: TypeScript使用
- **コードスタイル**: ESLint + Prettier
- **テストカバレッジ**: 単体・結合テスト
- **ドキュメント**: 包括的なREADME・コメント

### 開発プロセス
- **Git Flow**: 機能別ブランチ戦略
- **コードレビュー**: Pull Request必須
- **CI/CD**: 自動テスト・デプロイ
- **Issue管理**: GitHub Issues活用

## 📈 今後の拡張予定

- [ ] **リアルタイム機能**: WebSocketによるライブクイズ
- [ ] **AI機能**: 学習内容の自動推薦
- [ ] **モバイルアプリ**: React Native対応
- [ ] **多言語対応**: i18n国際化
- [ ] **動画学習**: 動画コンテンツ対応

## 📜 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 👨‍💻 作者

**ポートフォリオプロジェクト** - フルスタック開発スキルの実証

### 使用した技術・スキル
- バックエンド開発（Django, REST API）
- フロントエンド開発（React, TypeScript）
- データベース設計（PostgreSQL）
- インフラ・DevOps（AWS, Docker）
- UI/UXデザイン（Material-UI）
- プロジェクト管理・ドキュメント作成

---

⭐ このプロジェクトが参考になった場合は、スターをいただけると嬉しいです！