# Timeline Service

タイムライン生成とリアルタイム更新を担当するマイクロサービス

## 概要

Timeline Service は Mini-SNS のタイムライン機能を担当し、以下を提供します：

- ユーザーのタイムライン取得（フォローユーザーの投稿）
- WebSocket によるリアルタイム更新配信
- イベント駆動によるタイムライン自動更新
- Redis キャッシュによる高速応答

## 技術スタック

- **Runtime**: Node.js 20
- **Language**: TypeScript 5.3+
- **Framework**: AWS Lambda
- **Database**: DynamoDB
- **Cache**: ElastiCache Redis
- **Event Bus**: EventBridge
- **Real-time**: API Gateway WebSocket

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
REDIS_HOST=localhost
REDIS_PORT=6379
TIMELINE_TABLE_NAME=mini-sns-dev-timeline-ddb
NODE_ENV=development
```

## API エンドポイント

### GET /timeline

タイムライン取得

**Query Parameters:**
- `limit`: 取得件数（デフォルト: 20、最大: 100）
- `offset`: オフセット（ページネーション）

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "username": "johndoe"
      },
      "content": "投稿内容",
      "likesCount": 42,
      "isLiked": true,
      "createdAt": "2026-01-03T00:00:00Z"
    }
  ],
  "total": 100
}
```

### WebSocket /ws

リアルタイムタイムライン更新

**接続管理:**
- `$connect`: WebSocket 接続確立
- `$disconnect`: WebSocket 切断
- `$default`: メッセージハンドリング

## アーキテクチャ

### Fan-out on Write パターン

1. **PostCreated イベント受信**
   - 投稿者のフォロワーを取得（Social Service 経由）
   - 各フォロワーのタイムラインに投稿を追加（DynamoDB）
   - WebSocket 経由でリアルタイム配信

2. **FollowCreated イベント受信**
   - 新規フォローユーザーの投稿を取得（Post Service 経由）
   - タイムラインにバックフィル

3. **FollowDeleted イベント受信**
   - アンフォローユーザーの投稿をタイムラインから削除

### キャッシュ戦略

- Redis にタイムラインキャッシュ（TTL: 300 秒）
- キャッシュミス時は DynamoDB から取得
- Write-through キャッシュ更新

## サービス間通信

### 呼び出し先サービス
- **Post Service**: 投稿詳細取得
- **User Service**: ユーザー情報取得

**タイムアウト**: 10 秒
**リトライ**: 3 回（指数バックオフ）
**サーキットブレーカー**: エラー率 50% で起動

## テスト

```bash
npm run test
npm run test:coverage
```

## 関連ドキュメント

- [API 定義](../../docs/mini-sns/solutions/timeline-service/api.md)
- [DynamoDB 設計](../../docs/mini-sns/solutions/timeline-service/ddb-design.md)
- [シーケンス図](../../docs/mini-sns/solutions/timeline-service/sequence.md)
