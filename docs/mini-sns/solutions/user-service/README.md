# User Service

## 1. サービス概要

**責務**: ユーザー登録、認証（Cognito連携）、プロフィール管理

**Bounded Context**: ユーザー管理コンテキスト

## 2. 機能境界

### 2.1 含まれる機能
- ユーザー登録（POST /auth/register）
- ログイン（POST /auth/login）
- ログアウト（POST /auth/logout）
- トークンリフレッシュ（POST /auth/refresh）
- プロフィール取得（GET /users/{userId}）
- ユーザー投稿一覧取得（GET /users/{userId}/posts）- プロフィール更新（PUT /users/{userId}）

### 2.2 含まれない機能
- 投稿作成・削除（Post Serviceの責務）
- フォロー・いいね管理（Social Serviceの責務）
- タイムライン生成（Timeline Serviceの責務）

## 3. 依存関係

### 3.1 依存する外部サービス
- **Amazon Cognito**: ユーザー認証、JWTトークン発行
- **EventBridge**: UserRegistered、UserProfileUpdatedイベント発行

### 3.2 依存されるサービス（API呼び出し元）
- **Timeline Service**: ユーザー情報取得（GET /users/{userId}）
- **Social Service**: ユーザー存在確認（GET /users/{userId}）

## 4. データストア

- **DynamoDB**: `mini-sns-{env}-user-ddb`
  - PK: `USER#{userId}`, SK: `PROFILE`
  - GSI1: `email-index`
  - GSI2: `username-index`

## 5. 発行イベント

- `UserRegistered`: ユーザー登録時
- `UserProfileUpdated`: プロフィール更新時

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
