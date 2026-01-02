# Social Service

## 1. サービス概要

**責務**: フォロー/アンフォロー関係管理、いいね管理

**Bounded Context**: ソーシャルインタラクションコンテキスト

## 2. 機能境界

### 2.1 含まれる機能
- ユーザーフォロー（POST /users/{userId}/follow）
- ユーザーアンフォロー（DELETE /users/{userId}/follow）
- いいね付与（POST /posts/{postId}/likes）
- いいね削除（DELETE /posts/{postId}/likes）
- フォロワー一覧取得（GET /users/{userId}/followers）
- フォロー中一覧取得（GET /users/{userId}/following）
- いいね一覧取得（GET /posts/{postId}/likes）

### 2.2 含まれない機能
- ユーザー管理（User Serviceの責務）
- 投稿管理（Post Serviceの責務）
- タイムライン生成（Timeline Serviceの責務）

## 3. 依存関係

### 3.1 依存する外部サービス
- **User Service**: ユーザー存在確認（GET /users/{userId}）
- **Post Service**: 投稿存在確認（GET /posts/{postId}）
- **EventBridge**: Follow/Likeイベント発行

### 3.2 依存されるサービス（API呼び出し元）
- **Timeline Service**: フォロワーリスト取得（GET /users/{userId}/followers）

## 4. データストア

- **DynamoDB**: `mini-sns-{env}-social-ddb`（Single Table Design）
  - Follow: PK: `USER#{followerId}`, SK: `FOLLOW#{followeeId}`
  - Like: PK: `USER#{userId}`, SK: `LIKE#{postId}`
  - GSI1: `reverse-index`（フォロワー/いいね逆引き用）

## 5. 発行イベント

- `FollowCreated`: フォロー時（Timeline Serviceがタイムライン更新）
- `FollowDeleted`: アンフォロー時（Timeline Serviceがタイムライン削除）
- `LikeCreated`: いいね時（将来の通知機能用）
- `LikeDeleted`: いいね削除時（将来の通知機能用）

## 6. 購読イベント

- `PostDeleted`: 投稿削除時、いいねレコードをカスケード削除

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
