# [Implement] 投稿作成機能

Task-ID: POST-CRE-001  
Service: post-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/design/system-architecture.md, docs/mini-sns/solutions/post-service/**/*.md

## Purpose

Mini-SNSにおける投稿作成機能を実装する。ログイン済みユーザーが280文字以内のテキスト投稿を作成し、フォロワーに共有できるようにする。

## Scope

### 含まれる範囲
- POST /posts エンドポイントの実装
- DynamoDBへの投稿保存
- 入力バリデーション（1-280文字、XSS対策）
- PostCreatedイベントのEventBridge発行
- 冪等性制御（Idempotency-Keyヘッダー対応）
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- 投稿削除機能（POST-DEL-001で実装）
- 投稿編集機能（将来の拡張）
- 画像・動画添付（将来の拡張）
- ハッシュタグ解析（将来の拡張）
- DynamoDBテーブル作成（POST-DDB-001で実装）

## Contracts

### 入力
- **HTTPリクエスト**: POST /posts
- **ヘッダー**: 
  - Authorization: Bearer {token}
  - Idempotency-Key: {uuid} (オプション)
- **リクエストボディ**:
```json
{
  "content": "これはテスト投稿です"
}
```

### 出力
- **成功時（201 Created）**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "content": "これはテスト投稿です",
  "likes_count": 0,
  "created_at": "2026-01-03T00:00:00Z"
}
```
- **エラー時（400/401/500）**: エラーメッセージ

### イベント
- **発行**: PostCreated イベント（EventBridge経由）
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.post.created",
  "source": "post-service",
  "id": "uuid",
  "time": "2026-01-03T00:00:00Z",
  "data": {
    "postId": "uuid",
    "userId": "uuid",
    "content": "これはテスト投稿です",
    "createdAt": "2026-01-03T00:00:00Z"
  }
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ディレクトリ構成の作成（services/post-service/src/handlers/）
- [ ] 必要な依存関係の定義
- [ ] 環境変数設定ファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義（POST /posts、Cognito認証必須）
- [ ] Lambda関数エントリーポイントの作成
- [ ] リクエストスキーマバリデーション関数の実装
- [ ] DynamoDBクライアント初期化処理

### 3. Business Logic
- [ ] 投稿作成ビジネスロジックの実装
  - JWTトークンからユーザーID抽出
  - 入力バリデーション（1-280文字、XSS対策としてHTMLエスケープ）
  - UUID生成（postId）
  - DynamoDB PutItem（PK: POST#{postId}, SK: METADATA）
  - GSI書き込み（user-posts-index）
- [ ] 冪等性制御実装（Idempotency-Keyをキーにしたキャッシュ、TTL=24時間）
- [ ] PostCreatedイベント発行処理（EventBridge PutEvents、3秒以内）
- [ ] エラーハンドリング実装
- [ ] レート制限（1ユーザーあたり10投稿/分）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 有効な投稿内容での作成成功
  - 異常系: 空の投稿での作成失敗（400）
  - 異常系: 281文字以上の投稿での作成失敗（400）
  - 正常系: XSS攻撃文字列のエスケープ確認
  - 正常系: 冪等性キーによる重複作成防止
- [ ] 統合テスト
  - E2E: 投稿作成からイベント発行まで
  - E2E: Timeline Serviceでのイベント受信確認

## Acceptance Criteria

### AC-1: 正常系 - 有効な投稿の作成
```gherkin
Given ユーザーがログイン済みである
When "これはテスト投稿です" というテキストで投稿を作成する
Then HTTPステータス201が返される
And DynamoDBに投稿が保存される
And PostCreatedイベントが3秒以内に発行される
And 応答時間がp95で500ミリ秒以内である
```

### AC-2: 異常系 - 空の投稿
```gherkin
Given ユーザーがログイン済みである
When 空の内容で投稿を作成しようとする
Then HTTPステータス400が返される
And エラーメッセージ "投稿内容を入力してください" が返される
And DynamoDBに投稿は保存されない
```

### AC-3: 異常系 - 文字数超過
```gherkin
Given ユーザーがログイン済みである
When 281文字以上のテキストで投稿を作成しようとする
Then HTTPステータス400が返される
And エラーメッセージ "280文字以内で入力してください" が返される
```

### AC-4: セキュリティ - XSS対策
```gherkin
Given ユーザーがログイン済みである
When "<script>alert('XSS')</script>" を含む投稿を作成する
Then 投稿が正常に保存される
And DynamoDBのcontentフィールドでスクリプトがエスケープされている
And 取得時にスクリプトが実行されない
```

### AC-5: 冪等性 - 重複作成防止
```gherkin
Given ユーザーがIdempotency-Key "abc123" で投稿を作成した
When 同じIdempotency-Keyで再度投稿を作成しようとする
Then HTTPステータス201が返される
And 同じ投稿レスポンスが返される
And DynamoDBに重複した投稿は作成されない
```

## Risks

- **R-1**: スパム投稿による負荷
  - 対策: レート制限（10投稿/分/ユーザー）、将来的にコンテンツフィルタ追加
- **R-2**: EventBridge発行失敗によるタイムライン未反映
  - 対策: DLQ設定、リトライ機構、モニタリングアラート

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビューが完了し、承認されている
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
- [ ] XSS対策が実装されている
- [ ] CloudWatchアラーム設定が完了している（エラー率 > 1%）
