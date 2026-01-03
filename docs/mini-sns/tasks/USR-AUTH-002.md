# [Implement] ログイン機能

Task-ID: USR-AUTH-002  
Service: user-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/design/system-architecture.md, docs/mini-sns/solutions/user-service/**/*.md

## Purpose

Mini-SNSにおけるログイン機能を実装する。登録済みユーザーがメールアドレスとパスワードで認証し、JWTトークンを取得してサービスにアクセスできるようにする。

## Scope

### 含まれる範囲
- POST /auth/login エンドポイントの実装
- Amazon Cognito認証連携
- JWTトークン発行と返却
- リフレッシュトークン発行
- 入力バリデーション
- エラーハンドリング（認証失敗、アカウント未確認）
- セッション管理の基本実装

### 含まれない範囲（Non-Scope）
- ユーザー登録機能（USR-AUTH-001で実装）
- ログアウト機能（USR-AUTH-003で実装）
- パスワードリセット機能（将来の拡張）
- 多要素認証（将来の拡張）
- ソーシャルログイン（将来の拡張）

## Contracts

### 入力
- **HTTPリクエスト**: POST /auth/login
- **リクエストボディ**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 出力
- **成功時（200 OK）**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "testuser",
    "created_at": "2026-01-03T00:00:00Z"
  },
  "token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "expires_in": 3600
}
```
- **エラー時（401/400/500）**: エラーメッセージとエラーコード

### イベント
- **発行**: なし（ログインはイベント発行不要）

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成（login.handler）
- [ ] 必要な依存関係の確認（Cognito SDK）

### 2. API & Data
- [ ] API Gatewayルート定義（POST /auth/login）
- [ ] Lambda関数エントリーポイントの作成
- [ ] リクエストスキーマバリデーション関数の実装
- [ ] DynamoDBクライアント初期化処理

### 3. Business Logic
- [ ] ログインビジネスロジックの実装
  - Cognito InitiateAuth API呼び出し
  - 認証成功時のDynamoDBからユーザープロフィール取得
  - JWTトークンとリフレッシュトークンの返却
- [ ] エラーハンドリング実装
  - 誤ったパスワード（401）
  - 存在しないユーザー（401）
  - アカウント未確認状態のハンドリング
- [ ] セキュリティ対策
  - レート制限（同一IPから5回失敗で10分間ロック）
  - ログイン失敗時の詳細情報非表示（"メールアドレスまたはパスワードが正しくありません"）

### 4. UI
- [ ] 該当なし（バックエンド実装のみ）

### 5. Tests
- [ ] 単体テスト
  - 正常系: 有効な認証情報でのログイン成功
  - 異常系: 誤ったパスワードでのログイン失敗（401）
  - 異常系: 存在しないメールアドレスでのログイン失敗（401）
  - 異常系: 空のパスワードでのバリデーションエラー（400）
- [ ] 統合テスト
  - E2E: ログインAPIからJWTトークン取得まで
  - E2E: 取得したJWTトークンでの認証確認（他のエンドポイント呼び出し）

## Acceptance Criteria

### AC-1: 正常系 - 有効な認証情報でログイン
```gherkin
Given ユーザー "user@example.com" が登録済みである
When メールアドレス "user@example.com" とパスワード "correctPassword" を入力してログインする
Then HTTPステータス200が返される
And レスポンスにJWTトークンとリフレッシュトークンが含まれる
And レスポンスにユーザー情報が含まれる
And 応答時間がp95で200ミリ秒以内である
```

### AC-2: 異常系 - 誤ったパスワード
```gherkin
Given ユーザー "user@example.com" が登録済みである
When メールアドレス "user@example.com" と誤ったパスワード "wrongPassword" を入力する
Then HTTPステータス401が返される
And エラーメッセージ "メールアドレスまたはパスワードが正しくありません" が返される
And JWTトークンは返されない
```

### AC-3: セキュリティ - レート制限
```gherkin
Given 同一IPアドレスから5回連続でログイン失敗している
When 6回目のログイン試行を行う
Then HTTPステータス429が返される
And エラーメッセージ "試行回数が上限に達しました。10分後に再度お試しください" が返される
And 10分後に再度ログイン可能になる
```

### AC-4: 正常系 - トークン有効期限
```gherkin
Given ユーザーがログインに成功した
When レスポンスのトークン有効期限を確認する
Then アクセストークンの有効期限が1時間である
And リフレッシュトークンの有効期限が30日である
```

### AC-5: セキュリティ - ログ記録
```gherkin
Given ユーザーがログインを試行する
When ログインが成功または失敗する
Then CloudWatch Logsにログイン試行が記録される
And ログにパスワード平文は含まれない
And ログにユーザーID、メールアドレス、タイムスタンプ、成功/失敗が含まれる
```

## Risks

- **R-1**: ブルートフォース攻撃によるアカウント侵害
  - 対策: API Gatewayレート制限、Cognito Advanced Securityの有効化、失敗回数制限
- **R-2**: Cognito連携遅延によるタイムアウト
  - 対策: Lambda関数タイムアウトを10秒に設定、リトライロジック実装
- **R-3**: トークン漏洩リスク
  - 対策: HTTPS必須、短い有効期限（1時間）、セキュアなトークン保存ガイダンス提供

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で200ミリ秒以内
- [ ] コードレビューが完了し、承認されている
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
- [ ] レート制限が設定されている（5回失敗で10分ロック）
- [ ] CloudWatchアラーム設定が完了している（エラー率 > 5%）
