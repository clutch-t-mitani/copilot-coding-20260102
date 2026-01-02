# Post Service

## 1. サービス概要

**責務**: 投稿の作成、削除、取得

**Bounded Context**: 投稿コンテキスト

## 2. 機能境界

### 2.1 含まれる機能
- 投稿作成（POST /posts）
- 投稿詳細取得（GET /posts/{postId}）
- 投稿削除（DELETE /posts/{postId}）
- ユーザー投稿一覧取得（GET /users/{userId}/posts）
- 投稿バッチ取得（POST /posts/batch）※内部API

### 2.2 含まれない機能
- いいね管理（Social Serviceの責務）
- タイムライン生成（Timeline Serviceの責務）
- ユーザー管理（User Serviceの責務）

## 3. 依存関係

### 3.1 依存する外部サービス
- **EventBridge**: PostCreated、PostDeletedイベント発行

### 3.2 依存されるサービス（API呼び出し元）
- **Timeline Service**: 投稿詳細取得（GET /posts/{postId}、POST /posts/batch）

## 4. データストア

- **DynamoDB**: `mini-sns-{env}-post-ddb`
  - PK: `POST#{postId}`, SK: `METADATA`
  - GSI1: `user-posts-index` (PK: USER#{userId}, SK: createdAt)

## 5. 発行イベント

- `PostCreated`: 投稿作成時（最重要、Timeline Serviceがタイムライン更新）
- `PostDeleted`: 投稿削除時（Timeline ServiceとSocial Serviceが関連データ削除）

## 6. 購読イベント

なし

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
