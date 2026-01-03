# [Implement] いいね付与機能

Task-ID: SOC-LIKE-001  
Service: social-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/social-service/**/*.md

## Purpose

ユーザーが投稿にいいねを付与できる機能を実装する。

## Scope

### 含まれる範囲
- POST /posts/{postId}/likes エンドポイントの実装
- DynamoDBへのいいね情報保存
- 重複いいね防止
- LikeCreatedイベントの発行

### 含まれない範囲（Non-Scope）
- いいね削除機能（SOC-LIKE-002で実装）
- いいね数カウント（Post Serviceで管理）

## Contracts

### 入力
- **HTTPリクエスト**: POST /posts/{postId}/likes
- **ヘッダー**: Authorization: Bearer {token}

### 出力
- **成功時（201 Created）**:
```json
{
  "user_id": "uuid",
  "post_id": "uuid",
  "created_at": "2026-01-03T00:00:00Z"
}
```

### イベント
- **発行**: LikeCreated イベント

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB PutItem実装

### 3. Business Logic
- [ ] いいねビジネスロジック実装
  - JWTトークンからユーザーID抽出
  - Post Service API呼び出し（投稿存在確認）
  - 重複いいねチェック
  - DynamoDB PutItem（PK: USER#{userId}, SK: LIKE#{postId}）
- [ ] LikeCreatedイベント発行
- [ ] エラーハンドリング
  - 存在しない投稿（404）
  - 既にいいね済み（409）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト（正常系、異常系）
- [ ] 統合テスト

## Acceptance Criteria

### AC-1: 正常系 - いいね付与
```gherkin
Given ユーザーAがログイン済みである
And 投稿Xにいいねを付けていない
When 投稿Xにいいねを付ける
Then HTTPステータス201が返される
And DynamoDBにいいねが保存される
And LikeCreatedイベントが発行される
```

### AC-2: 異常系 - 重複いいね
```gherkin
Given ユーザーAが投稿Xに既にいいねを付けている
When 再度投稿Xにいいねを付けようとする
Then HTTPステータス409が返される
```

### AC-3: 異常系 - 存在しない投稿
```gherkin
Given 投稿IDが存在しない
When いいねを付けようとする
Then HTTPステータス404が返される
```

## Risks

- **R-1**: Post Service障害時のいいね失敗
  - 対策: タイムアウト設定、エラーハンドリング

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビュー完了
