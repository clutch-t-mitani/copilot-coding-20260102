# [Implement] プロフィール更新機能

Task-ID: USR-PROF-002  
Service: user-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/design/system-architecture.md, docs/mini-sns/solutions/user-service/**/*.md

## Purpose

Mini-SNSにおけるユーザープロフィール更新機能を実装する。ログイン済みユーザーが自分のプロフィール情報（ユーザー名、表示名など）を更新できるようにする。

## Scope

### 含まれる範囲
- PUT /users/{userId} エンドポイントの実装
- DynamoDBでのプロフィール情報更新
- ユーザー名重複チェック
- 本人確認（自分のプロフィールのみ更新可能）
- UserProfileUpdatedイベントの発行

### 含まれない範囲（Non-Scope）
- メールアドレス変更（将来の拡張）
- パスワード変更（将来の拡張）
- プロフィール画像アップロード（将来の拡張）

## Contracts

### 入力
- **HTTPリクエスト**: PUT /users/{userId}
- **ヘッダー**: Authorization: Bearer {token}
- **リクエストボディ**:
```json
{
  "username": "newusername"
}
```

### 出力
- **成功時（200 OK）**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "newusername",
  "updated_at": "2026-01-03T00:00:00Z"
}
```
- **エラー時（400/401/403/409/500）**: エラーメッセージ

### イベント
- **発行**: UserProfileUpdated イベント（EventBridge経由）

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成（updateProfile.handler）

### 2. API & Data
- [ ] API Gatewayルート定義（PUT /users/{userId}、Cognito認証必須）
- [ ] Lambda関数エントリーポイントの作成

### 3. Business Logic
- [ ] プロフィール更新ビジネスロジックの実装
  - JWTトークンからユーザーID抽出
  - 本人確認（トークンのuserIdとパスパラメータのuserIdが一致）
  - ユーザー名重複チェック（DynamoDB GSI: username-index）
  - DynamoDB UpdateItem実行
  - Redisキャッシュ無効化
- [ ] UserProfileUpdatedイベント発行処理
- [ ] エラーハンドリング実装
  - 権限なし（403）: 他人のプロフィール更新試行
  - ユーザー名重複（409）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 自分のプロフィール更新成功
  - 異常系: 他人のプロフィール更新試行で失敗（403）
  - 異常系: 重複ユーザー名での更新失敗（409）
- [ ] 統合テスト
  - E2E: プロフィール更新からイベント発行まで

## Acceptance Criteria

### AC-1: 正常系 - プロフィール更新成功
```gherkin
Given ユーザーAがログイン済みである
When 自分のユーザー名を "newname" に更新する
Then HTTPステータス200が返される
And DynamoDBのレコードが更新される
And UserProfileUpdatedイベントが発行される
And Redisキャッシュが無効化される
```

### AC-2: 異常系 - 他人のプロフィール更新
```gherkin
Given ユーザーAがログイン済みである
When ユーザーBのプロフィール更新を試みる
Then HTTPステータス403が返される
And エラーメッセージ "この操作は許可されていません" が返される
And DynamoDBのレコードは更新されない
```

### AC-3: 異常系 - ユーザー名重複
```gherkin
Given ユーザー名 "existinguser" が既に使用されている
When 自分のユーザー名を "existinguser" に変更しようとする
Then HTTPステータス409が返される
And エラーメッセージ "このユーザー名は既に使用されています" が返される
```

## Risks

- **R-1**: 同時更新による競合
  - 対策: DynamoDB条件付き更新（バージョン番号）

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビューが完了し、承認されている
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
