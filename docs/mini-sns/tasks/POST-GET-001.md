# [Implement] 投稿詳細取得機能

Task-ID: POST-GET-001  
Service: post-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/post-service/**/*.md

## Purpose

投稿IDを指定して投稿の詳細情報を取得する機能を実装する。

## Scope

### 含まれる範囲
- GET /posts/{postId} エンドポイントの実装
- DynamoDBからの投稿取得
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- いいね数の取得（Social Service連携は将来対応）
- 投稿作成機能（POST-CRE-001で実装）

## Contracts

### 入力
- **HTTPリクエスト**: GET /posts/{postId}
- **ヘッダー**: Authorization: Bearer {token}

### 出力
- **成功時（200 OK）**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "content": "投稿内容",
  "likes_count": 0,
  "created_at": "2026-01-03T00:00:00Z"
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB GetItem実装

### 3. Business Logic
- [ ] 投稿取得ロジック実装
- [ ] エラーハンドリング（404: 投稿が存在しない）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト（正常系、異常系）
- [ ] 統合テスト

## Acceptance Criteria

### AC-1: 正常系 - 投稿詳細取得
```gherkin
Given 投稿IDが存在する
When GET /posts/{postId}を呼び出す
Then HTTPステータス200が返される
And 投稿の詳細情報が返される
And 応答時間がp95で200ミリ秒以内である
```

### AC-2: 異常系 - 存在しない投稿
```gherkin
Given 投稿IDが存在しない
When GET /posts/{postId}を呼び出す
Then HTTPステータス404が返される
```

## Risks

- **R-1**: DynamoDB読み取り遅延
  - 対策: キャッシング戦略（将来実装）

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] API応答時間がp95で200ミリ秒以内
- [ ] コードレビュー完了
