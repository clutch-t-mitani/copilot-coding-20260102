# Post Service

投稿の作成、削除、取得を担当するマイクロサービス

## 概要

Post Service は Mini-SNS の投稿管理を担当し、以下の機能を提供します：

- 投稿の作成（最大 280 文字）
- 投稿の削除
- 投稿の取得
- ユーザーの投稿一覧取得

## 技術スタック

- **Runtime**: Node.js 20
- **Language**: TypeScript 5.3+
- **Framework**: AWS Lambda
- **Database**: DynamoDB
- **Event Bus**: EventBridge

## ローカル開発

### セットアップ

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 開発モード
npm run dev

# テスト実行
npm run test
```

### 環境変数

```bash
# AWS Configuration
AWS_REGION=ap-northeast-1
DYNAMODB_ENDPOINT=http://localhost:8000

# DynamoDB
POST_TABLE_NAME=mini-sns-dev-post-ddb

# Application
NODE_ENV=development
LOG_LEVEL=debug
```

## API エンドポイント

### POST /posts

投稿作成

**Request Body:**
```json
{
  "content": "これはテスト投稿です"
}
```

**Validation:**
- content: 1-280 文字
- XSS 対策のサニタイゼーション実施

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "content": "これはテスト投稿です",
  "likesCount": 0,
  "createdAt": "2026-01-03T00:00:00Z"
}
```

### GET /posts/{postId}

投稿詳細取得

### DELETE /posts/{postId}

投稿削除（作成者のみ）

### GET /users/{userId}/posts

ユーザーの投稿一覧取得

## イベント発行

- `PostCreated`: 投稿作成時
- `PostDeleted`: 投稿削除時

## テスト

```bash
npm run test
npm run test:coverage
```

## 関連ドキュメント

- [API 定義](../../docs/mini-sns/solutions/post-service/api.md)
- [ドメインモデル](../../docs/mini-sns/solutions/post-service/domain-model.md)
- [DynamoDB 設計](../../docs/mini-sns/solutions/post-service/ddb-design.md)
