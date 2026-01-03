# User Service

ユーザー認証とプロフィール管理を担当するマイクロサービス

## 概要

User Service は Mini-SNS のユーザー管理を担当し、以下の機能を提供します：

- ユーザー登録（Amazon Cognito 連携）
- ログイン・ログアウト
- JWT トークン発行・検証
- ユーザープロフィール管理
- ユーザー情報の取得

## 技術スタック

- **Runtime**: Node.js 20
- **Language**: TypeScript 5.3+
- **Framework**: AWS Lambda
- **Database**: DynamoDB
- **Authentication**: Amazon Cognito
- **Event Bus**: EventBridge

## ローカル開発

### 前提条件

- Node.js 20 以上
- npm 10 以上
- Docker と Docker Compose（ローカル AWS サービスエミュレーション用）

### セットアップ

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 開発モード（ホットリロード）
npm run dev

# テスト実行
npm run test

# カバレッジ付きテスト
npm run test:coverage
```

### 環境変数

`.env.example` をコピーして `.env` を作成し、以下の環境変数を設定：

```bash
# AWS Configuration
AWS_REGION=ap-northeast-1
DYNAMODB_ENDPOINT=http://localhost:8000

# Cognito
COGNITO_USER_POOL_ID=local-user-pool
COGNITO_CLIENT_ID=local-client-id

# DynamoDB
USER_TABLE_NAME=mini-sns-dev-user-ddb

# Application
NODE_ENV=development
LOG_LEVEL=debug
```

## API エンドポイント

### POST /auth/register

ユーザー登録

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### POST /auth/login

ログイン

### GET /users/{userId}

ユーザープロフィール取得

## テスト

```bash
# 全テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

## デプロイ

```bash
# ビルド
npm run build

# Terraform でデプロイ（ルートディレクトリから）
cd ../../infra/terraform/envs/dev
terraform apply
```

## 関連ドキュメント

- [API 定義](../../docs/mini-sns/solutions/user-service/api.md)
- [ドメインモデル](../../docs/mini-sns/solutions/user-service/domain-model.md)
- [DynamoDB 設計](../../docs/mini-sns/solutions/user-service/ddb-design.md)
