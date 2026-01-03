# [Implement] 投稿バッチ取得機能

Task-ID: POST-BATCH-001  
Service: post-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/solutions/post-service/**/*.md

## Purpose

複数の投稿IDを一括で取得する内部API機能を実装する。Timeline Serviceがタイムライン表示時に使用する。

## Scope

### 含まれる範囲
- POST /posts/batch エンドポイントの実装（内部API）
- DynamoDB BatchGetItem使用
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- 公開API（内部サービス間通信のみ）

## Contracts

### 入力
- **HTTPリクエスト**: POST /posts/batch
- **ヘッダー**: Authorization: Bearer {token}
- **リクエストボディ**:
```json
{
  "postIds": ["uuid1", "uuid2", "uuid3"]
}
```

### 出力
- **成功時（200 OK）**:
```json
{
  "posts": [
    {
      "id": "uuid1",
      "user_id": "uuid",
      "content": "投稿内容",
      "likes_count": 0,
      "created_at": "2026-01-03T00:00:00Z"
    }
  ]
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB BatchGetItem実装

### 3. Business Logic
- [ ] バッチ取得ロジック実装
  - 最大100件の制限
  - 存在しないIDはスキップ
- [ ] エラーハンドリング

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 複数投稿の一括取得
  - 境界値: 100件制限の確認
- [ ] 統合テスト

## Acceptance Criteria

### AC-1: 正常系 - バッチ取得
```gherkin
Given 3件の投稿が存在する
When 3件のpostIdを指定してバッチ取得する
Then HTTPステータス200が返される
And 3件の投稿が返される
And 応答時間がp95で250ミリ秒以内である
```

### AC-2: 境界値 - 100件制限
```gherkin
When 101件のpostIdを指定する
Then HTTPステータス400が返される
And エラーメッセージ "最大100件まで取得可能です" が返される
```

## Risks

- **R-1**: BatchGetItemの制限
  - 対策: 100件ごとに分割処理

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] API応答時間がp95で250ミリ秒以内
- [ ] コードレビュー完了
