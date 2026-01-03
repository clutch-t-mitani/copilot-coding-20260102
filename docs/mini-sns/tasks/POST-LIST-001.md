# [Implement] ユーザー投稿一覧取得機能

Task-ID: POST-LIST-001  
Service: post-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/post-service/**/*.md

## Purpose

特定ユーザーの投稿一覧を時系列順に取得する機能を実装する。プロフィールページでの投稿表示に使用される。

## Scope

### 含まれる範囲
- GET /users/{userId}/posts エンドポイントの実装
- DynamoDB GSI（user-posts-index）を使用したクエリ
- ページネーション対応（limit, offset）
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- タイムライン機能（Timeline Serviceの責務）
- 投稿検索機能（将来の拡張）

## Contracts

### 入力
- **HTTPリクエスト**: GET /users/{userId}/posts?limit=20&offset=0
- **ヘッダー**: Authorization: Bearer {token}
- **クエリパラメータ**:
  - limit: 取得件数（デフォルト20、最大100）
  - offset: オフセット（デフォルト0）

### 出力
- **成功時（200 OK）**:
```json
{
  "posts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "content": "投稿内容",
      "likes_count": 0,
      "created_at": "2026-01-03T00:00:00Z"
    }
  ],
  "total": 100
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB Query実装（GSI: user-posts-index）

### 3. Business Logic
- [ ] 投稿一覧取得ロジック実装
  - GSIクエリ（PK: USER#{userId}, SK: createdAt降順）
  - ページネーション処理
  - 投稿数カウント
- [ ] エラーハンドリング

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: ユーザーの投稿一覧取得
  - 正常系: ページネーション動作確認
  - 境界値: 投稿が0件の場合
- [ ] 統合テスト

## Acceptance Criteria

### AC-1: 正常系 - 投稿一覧取得
```gherkin
Given ユーザーAが10件の投稿を作成済みである
When GET /users/{userIdA}/posts?limit=5を呼び出す
Then HTTPステータス200が返される
And 最新5件の投稿が時系列順に返される
And 応答時間がp95で200ミリ秒以内である
```

### AC-2: 境界値 - 投稿が0件
```gherkin
Given ユーザーBが投稿を作成していない
When GET /users/{userIdB}/postsを呼び出す
Then HTTPステータス200が返される
And 空の配列が返される
And totalが0である
```

### AC-3: ページネーション
```gherkin
Given ユーザーが100件の投稿を作成済みである
When limit=20&offset=20で取得する
Then 21-40件目の投稿が返される
```

## Risks

- **R-1**: 大量投稿時のクエリ遅延
  - 対策: GSI適切な設計、limit上限100件

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] API応答時間がp95で200ミリ秒以内
- [ ] コードレビュー完了
