# [Implement] ユーザー登録機能

Task-ID: USR-AUTH-001  
Service: user-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/design/system-architecture.md, docs/mini-sns/solutions/user-service/**/*.md

## Purpose

Mini-SNSにおけるユーザー登録機能を実装する。新規ユーザーがメールアドレス、ユーザー名、パスワードを入力してアカウントを作成できるようにする。Amazon Cognitoと連携してユーザー認証情報を管理し、DynamoDBにプロフィール情報を保存する。

## Scope

### 含まれる範囲
- POST /auth/register エンドポイントの実装
- Amazon Cognitoユーザープール連携
- ユーザープロフィールのDynamoDB保存
- UserRegisteredイベントのEventBridge発行
- 入力バリデーション（メール形式、ユーザー名長さ、パスワード強度）
- エラーハンドリング（重複メール、Cognito連携失敗）
- JWTトークンの発行と返却

### 含まれない範囲（Non-Scope）
- ログイン機能（USR-AUTH-002で実装）
- プロフィール更新機能（USR-PROF-002で実装）
- メール認証機能（将来の拡張）
- ソーシャルログイン（将来の拡張）
- DynamoDBテーブルの作成（USR-DDB-001で実装）

## Contracts

### 入力
- **HTTPリクエスト**: POST /auth/register
- **リクエストボディ**:
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "SecurePass123!"
}
```

### 出力
- **成功時（201 Created）**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "testuser",
    "created_at": "2026-01-03T00:00:00Z"
  },
  "token": "eyJhbGci...",
  "refresh_token": "eyJhbGci..."
}
```
- **エラー時（400/409/500）**: エラーメッセージとエラーコード

### イベント
- **発行**: UserRegistered イベント（EventBridge経由）
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.user.registered",
  "source": "user-service",
  "id": "uuid",
  "time": "2026-01-03T00:00:00Z",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "testuser"
  }
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ディレクトリ構成の作成（services/user-service/src/handlers/）
- [ ] 必要な依存関係の定義（package.json または requirements.txt）
- [ ] 環境変数設定ファイルの作成（.env.example）

### 2. API & Data
- [ ] API Gatewayルート定義（POST /auth/register）
- [ ] Lambda関数エントリーポイントの作成（register.handler）
- [ ] リクエストスキーマバリデーション関数の実装
- [ ] DynamoDBクライアント初期化処理

### 3. Business Logic
- [ ] ユーザー登録ビジネスロジックの実装
  - メール重複チェック（DynamoDB GSI: email-index）
  - ユーザー名重複チェック（DynamoDB GSI: username-index）
  - Cognito SignUp API呼び出し
  - DynamoDBへのプロフィール保存（PK: USER#{userId}, SK: PROFILE）
  - JWTトークン取得
- [ ] UserRegisteredイベント発行処理（EventBridge PutEvents）
- [ ] エラーハンドリング実装（CognitoException、DynamoDBException）
- [ ] トランザクション制御（Cognito登録失敗時のロールバック）

### 4. UI
- [ ] 該当なし（バックエンド実装のみ）

### 5. Tests
- [ ] 単体テスト
  - 正常系: 有効な入力での登録成功
  - 異常系: 重複メールアドレスでの登録失敗（409）
  - 異常系: 不正なパスワード（8文字未満）での登録失敗（400）
  - 異常系: Cognito連携エラー時の適切なエラーハンドリング
- [ ] 統合テスト
  - E2E: 登録APIからDynamoDB保存、イベント発行まで
  - E2E: 登録後のJWTトークンでの認証確認

## Acceptance Criteria

### AC-1: 正常系 - 有効な情報での登録
```gherkin
Given ユーザーが未登録である
When メールアドレス "user@example.com"、パスワード "SecurePass123!"、ユーザー名 "testuser" を入力して登録APIを呼び出す
Then HTTPステータス201が返される
And レスポンスにユーザー情報とJWTトークンが含まれる
And DynamoDBにユーザープロフィールが保存される
And UserRegisteredイベントがEventBridgeに発行される
And 応答時間がp95で500ミリ秒以内である
```

### AC-2: 異常系 - 重複メールアドレス
```gherkin
Given メールアドレス "existing@example.com" が既に登録されている
When 同じメールアドレスで新規登録を試みる
Then HTTPステータス409が返される
And エラーメッセージ "このメールアドレスは既に使用されています" が返される
And Cognitoにユーザーは作成されない
And DynamoDBに新規レコードは作成されない
```

### AC-3: 異常系 - 不正なパスワード
```gherkin
Given ユーザーが登録APIにアクセスする
When パスワードに "123" (8文字未満)を指定する
Then HTTPステータス400が返される
And エラーメッセージ "パスワードは8文字以上で入力してください" が返される
And Cognitoにユーザーは作成されない
```

### AC-4: セキュリティ - パスワードハッシュ化
```gherkin
Given ユーザーが登録を完了した
When Cognitoのユーザーレコードを確認する
Then パスワードがハッシュ化されて保存されている
And 平文パスワードはレスポンスに含まれない
And 平文パスワードはログに記録されない
```

### AC-5: イベント発行
```gherkin
Given ユーザーが正常に登録完了した
When EventBridgeのイベントログを確認する
Then UserRegisteredイベントが1件発行されている
And イベントデータにuserId、email、usernameが含まれる
And イベント発行が3秒以内に完了している
```

## Risks

- **R-1**: Cognito連携失敗時のデータ不整合
  - 対策: Cognito登録成功後のみDynamoDB保存を実行、失敗時はCognitoユーザー削除
- **R-2**: 高負荷時のレート制限
  - 対策: API Gatewayでレート制限設定（100 req/秒）、Cognitoのクォータ監視
- **R-3**: パスワードポリシー変更時の互換性
  - 対策: バリデーションロジックを設定ファイル化、環境変数で管理

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビューが完了し、承認されている
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
- [ ] ドキュメント（README、API仕様）が更新されている
- [ ] CloudWatchアラーム設定が完了している（エラー率 > 1%）
