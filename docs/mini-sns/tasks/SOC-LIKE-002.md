# [Implement] いいね削除機能

Task-ID: SOC-LIKE-002  
Service: social-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/social-service/**/*.md

## Purpose

ユーザーが投稿のいいねを削除できる機能を実装する。

## Scope

### 含まれる範囲
- DELETE /posts/{postId}/likes エンドポイントの実装
- DynamoDBからのいいね情報削除
- LikeDeletedイベントの発行

### 含まれない範囲（Non-Scope）
- いいね付与機能（SOC-LIKE-001で実装）

## Contracts

### 入力
- **HTTPリクエスト**: DELETE /posts/{postId}/likes
- **ヘッダー**: Authorization: Bearer {token}

### 出力
- **成功時（204 No Content）**: レスポンスボディなし

### イベント
- **発行**: LikeDeleted イベント

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB DeleteItem実装

### 3. Business Logic
- [ ] いいね削除ビジネスロジック実装
  - いいね存在確認
  - DynamoDB DeleteItem実行
- [ ] LikeDeletedイベント発行
- [ ] エラーハンドリング（404: いいねが存在しない）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト（正常系、異常系）
- [ ] 統合テスト

## Acceptance Criteria

### AC-1: 正常系 - いいね削除
```gherkin
Given ユーザーAが投稿Xにいいねを付けている
When 投稿Xのいいねを削除する
Then HTTPステータス204が返される
And DynamoDBからいいねが削除される
And LikeDeletedイベントが発行される
```

### AC-2: 異常系 - いいねしていない投稿
```gherkin
Given ユーザーAが投稿Xにいいねを付けていない
When 投稿Xのいいねを削除しようとする
Then HTTPステータス404が返される
```

## Risks

- **R-1**: なし

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビュー完了
