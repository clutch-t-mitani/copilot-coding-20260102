# [Implement] ログアウト機能

Task-ID: USR-AUTH-003  
Service: user-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/design/system-architecture.md, docs/mini-sns/solutions/user-service/**/*.md

## Purpose

Mini-SNSにおけるログアウト機能を実装する。ログイン済みユーザーがセッションを終了し、JWTトークンを無効化できるようにする。

## Scope

### 含まれる範囲
- POST /auth/logout エンドポイントの実装
- JWTトークン無効化処理
- セッション終了処理
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- ログイン機能（USR-AUTH-002で実装）
- 全デバイスからのログアウト（将来の拡張）
- セッション管理UI（フロントエンド実装）

## Contracts

### 入力
- **HTTPリクエスト**: POST /auth/logout
- **ヘッダー**: Authorization: Bearer {token}

### 出力
- **成功時（204 No Content）**: レスポンスボディなし
- **エラー時（401/500）**: エラーメッセージとエラーコード

### イベント
- **発行**: なし

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成（logout.handler）

### 2. API & Data
- [ ] API Gatewayルート定義（POST /auth/logout、Cognito認証必須）
- [ ] Lambda関数エントリーポイントの作成

### 3. Business Logic
- [ ] ログアウトビジネスロジックの実装
  - JWTトークンからユーザーIDを抽出
  - Cognito GlobalSignOut API呼び出し
  - トークンブラックリスト登録（Redis使用、TTL=1時間）
- [ ] エラーハンドリング実装

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 有効なトークンでのログアウト成功
  - 異常系: 無効なトークンでのログアウト失敗（401）
- [ ] 統合テスト
  - E2E: ログアウト後のトークン無効確認

## Acceptance Criteria

### AC-1: 正常系 - ログアウト成功
```gherkin
Given ユーザーがログイン済みである
When ログアウトAPIを呼び出す
Then HTTPステータス204が返される
And セッションが無効化される
And 同じトークンでの再認証が失敗する
```

### AC-2: 異常系 - 未認証でのログアウト
```gherkin
Given ユーザーがログインしていない
When 無効なトークンでログアウトAPIを呼び出す
Then HTTPステータス401が返される
```

### AC-3: セキュリティ - トークン無効化
```gherkin
Given ユーザーがログアウトした
When 同じJWTトークンで保護されたエンドポイントにアクセスする
Then HTTPステータス401が返される
And エラーメッセージ "認証が必要です" が返される
```

## Risks

- **R-1**: Redisダウン時のトークン無効化失敗
  - 対策: フォールバック処理、Cognito GlobalSignOutのみ実行

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で200ミリ秒以内
- [ ] コードレビューが完了し、承認されている
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
