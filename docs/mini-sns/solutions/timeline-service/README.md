# Timeline Service

## 1. サービス概要

**責務**: タイムライン生成、リアルタイム配信（WebSocket）

**Bounded Context**: タイムラインコンテキスト

## 2. 機能境界

### 2.1 含まれる機能
- タイムライン取得（GET /timeline）
- WebSocket接続（WSS /ws）
- リアルタイム投稿配信（WebSocket push）
- タイムライン更新（PostCreated/FollowCreatedイベント購読）

### 2.2 含まれない機能
- 投稿作成（Post Serviceの責務）
- フォロー管理（Social Serviceの責務）
- ユーザー管理（User Serviceの責務）

## 3. 依存関係

### 3.1 依存する外部サービス
- **Post Service**: 投稿詳細取得（GET /posts/batch）
- **User Service**: ユーザー情報取得（GET /users/batch）
- **Social Service**: フォロワーリスト取得（GET /users/{userId}/followers）
- **ElastiCache Redis**: タイムラインキャッシュ、WebSocket接続管理
- **EventBridge/SQS**: PostCreated、FollowCreatedイベント購読

### 3.2 依存されるサービス（API呼び出し元）
- **Client（Web App）**: タイムライン取得、WebSocket接続

## 4. データストア

- **DynamoDB**: `mini-sns-{env}-timeline-ddb`
  - PK: `USER#{userId}`, SK: `POST#{createdAt}#{postId}`
  - TTL: 30日自動削除
- **ElastiCache Redis**: 
  - タイムラインキャッシュ（TTL: 60秒）
  - WebSocket接続管理

## 5. 発行イベント

なし

## 6. 購読イベント

- `PostCreated`: 新規投稿をフォロワーのタイムラインに追加
- `PostDeleted`: 削除された投稿をタイムラインから削除
- `FollowCreated`: フォロー対象の最新投稿をタイムラインに追加
- `FollowDeleted`: フォロー対象の投稿をタイムラインから削除

## 7. 関連ドキュメント

- [API定義](./api.md)
- [サービス契約](./service-contracts.md)
- [ドメインモデル](./domain-model.md)
- [DynamoDB設計](./ddb-design.md)
- [シーケンス図](./sequence.md)
- [エラー仕様](./errors.md)
- [非機能要件](./nonfunctional.md)
- [冪等性設計](./idempotency.md)
- [運用手順](./runbook.md)
