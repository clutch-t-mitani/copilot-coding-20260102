# Social Service

フォロー/アンフォロー関係管理といいね管理を担当するマイクロサービス

## 概要

Social Service は Mini-SNS のソーシャルグラフを担当し、以下の機能を提供します：

- ユーザーのフォロー/アンフォロー
- 投稿への「いいね」/「いいね解除」
- フォロワー/フォロー数の取得
- いいね数の取得

## 技術スタック

- **Runtime**: Node.js 20
- **Language**: TypeScript 5.3+
- **Framework**: AWS Lambda
- **Database**: DynamoDB (Single Table Design)
- **Event Bus**: EventBridge

## ローカル開発

### セットアップ

```bash
npm install
npm run build
npm run dev
npm run test
```

### 環境変数

```bash
AWS_REGION=ap-northeast-1
DYNAMODB_ENDPOINT=http://localhost:8000
SOCIAL_TABLE_NAME=mini-sns-dev-social-ddb
NODE_ENV=development
```

## API エンドポイント

### POST /users/{userId}/follow

ユーザーをフォロー

**制約:**
- 自分自身のフォロー禁止
- 重複フォロー防止（UNIQUE 制約）

### DELETE /users/{userId}/follow

ユーザーをアンフォロー

### POST /posts/{postId}/likes

投稿にいいね

**制約:**
- 重複いいね防止（UNIQUE 制約）

### DELETE /posts/{postId}/likes

いいね解除

## イベント

### 発行イベント
- `FollowCreated`: フォロー時
- `FollowDeleted`: アンフォロー時
- `LikeCreated`: いいね時
- `LikeDeleted`: いいね解除時

### 購読イベント
- `PostDeleted`: 投稿削除時（関連いいねのクリーンアップ）

## DynamoDB 設計

Single Table Design を採用：

- Follow: `PK=USER#{followerId}`, `SK=FOLLOW#{followeeId}`
- Like: `PK=USER#{userId}`, `SK=LIKE#{postId}`
- GSI1: 逆引きインデックス

## テスト

```bash
npm run test
npm run test:coverage
```

## 関連ドキュメント

- [API 定義](../../docs/mini-sns/solutions/social-service/api.md)
- [DynamoDB 設計](../../docs/mini-sns/solutions/social-service/ddb-design.md)
