# [Implement] 投稿削除機能

Task-ID: POST-DEL-001  
Service: post-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/post-service/**/*.md

## Purpose

ログイン済みユーザーが自分の投稿を削除できる機能を実装する。

## Scope

### 含まれる範囲
- DELETE /posts/{postId} エンドポイントの実装
- 本人確認（自分の投稿のみ削除可能）
- DynamoDBからの投稿削除
- PostDeletedイベントの発行
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- 他人の投稿削除（管理機能は将来対応）
- 論理削除（物理削除のみ）

## Contracts

### 入力
- **HTTPリクエスト**: DELETE /posts/{postId}
- **ヘッダー**: Authorization: Bearer {token}

### 出力
- **成功時（204 No Content）**: レスポンスボディなし
- **エラー時（401/403/404/500）**: エラーメッセージ

### イベント
- **発行**: PostDeleted イベント（EventBridge経由）

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB DeleteItem実装

### 3. Business Logic
- [ ] 投稿削除ビジネスロジック実装
  - JWTトークンからユーザーID抽出
  - DynamoDBから投稿取得（本人確認用）
  - 本人確認（post.user_id == token.user_id）
  - DynamoDB DeleteItem実行
- [ ] PostDeletedイベント発行処理
- [ ] エラーハンドリング
  - 権限なし（403）: 他人の投稿削除試行
  - 投稿が存在しない（404）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 自分の投稿削除成功
  - 異常系: 他人の投稿削除試行で失敗（403）
  - 異常系: 存在しない投稿削除試行で失敗（404）
- [ ] 統合テスト
  - E2E: 投稿削除からイベント発行まで

## Acceptance Criteria

### AC-1: 正常系 - 自分の投稿を削除
```gherkin
Given ユーザーAが投稿Xを作成済みである
When 投稿Xの削除APIを呼び出す
Then HTTPステータス204が返される
And DynamoDBから投稿Xが削除される
And PostDeletedイベントが発行される
```

### AC-2: 異常系 - 他人の投稿削除の防止
```gherkin
Given ユーザーBが投稿Yを作成している
When ユーザーAが投稿Yの削除を試みる
Then HTTPステータス403が返される
And エラーメッセージ "この操作は許可されていません" が返される
And 投稿Yは削除されない
```

### AC-3: 異常系 - 存在しない投稿の削除
```gherkin
Given 投稿IDが存在しない
When 削除APIを呼び出す
Then HTTPステータス404が返される
```

### AC-4: イベント発行確認
```gherkin
Given ユーザーが投稿を削除した
When EventBridgeのイベントログを確認する
Then PostDeletedイベントが発行されている
And イベントにpostIdが含まれる
```

## Risks

- **R-1**: カスケード削除の実装漏れ
  - 対策: PostDeletedイベントを購読するサービス（Social, Timeline）での処理実装確認

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビュー完了
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
