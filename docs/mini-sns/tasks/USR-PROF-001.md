# [Implement] プロフィール取得機能

Task-ID: USR-PROF-001  
Service: user-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/design/system-architecture.md, docs/mini-sns/solutions/user-service/**/*.md

## Purpose

Mini-SNSにおけるユーザープロフィール取得機能を実装する。ログイン済みユーザーが自分または他のユーザーのプロフィール情報を閲覧できるようにする。

## Scope

### 含まれる範囲
- GET /users/{userId} エンドポイントの実装
- DynamoDBからのプロフィール情報取得
- 認証必須の実装
- フォロー・フォロワー数の取得（Social Service API呼び出し）
- 投稿数の取得（Post Service API呼び出し）

### 含まれない範囲（Non-Scope）
- プロフィール更新機能（USR-PROF-002で実装）
- ユーザー検索機能（将来の拡張）
- プロフィール画像アップロード（将来の拡張）

## Contracts

### 入力
- **HTTPリクエスト**: GET /users/{userId}
- **ヘッダー**: Authorization: Bearer {token}
- **パスパラメータ**: userId (UUID)

### 出力
- **成功時（200 OK）**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "testuser",
  "created_at": "2026-01-03T00:00:00Z",
  "posts_count": 10,
  "followers_count": 5,
  "following_count": 3,
  "is_following": false
}
```
- **エラー時（401/404/500）**: エラーメッセージ

### イベント
- **発行**: なし

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成（getProfile.handler）

### 2. API & Data
- [ ] API Gatewayルート定義（GET /users/{userId}、Cognito認証必須）
- [ ] Lambda関数エントリーポイントの作成
- [ ] DynamoDBクライアント初期化処理

### 3. Business Logic
- [ ] プロフィール取得ビジネスロジックの実装
  - DynamoDBからユーザープロフィール取得（PK: USER#{userId}, SK: PROFILE）
  - Social Service API呼び出し（フォロー数、フォロワー数、is_following）
  - Post Service API呼び出し（投稿数）
  - レスポンスの組み立て
- [ ] エラーハンドリング実装
  - ユーザーが存在しない（404）
  - 他サービスAPI呼び出し失敗時のフォールバック（カウント=0）
- [ ] キャッシング戦略実装（Redis、TTL=60秒）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 自分のプロフィール取得成功
  - 正常系: 他ユーザーのプロフィール取得成功
  - 異常系: 存在しないユーザーIDでの取得失敗（404）
- [ ] 統合テスト
  - E2E: プロフィール取得APIから全データ返却まで
  - E2E: Social/Post Service統合確認

## Acceptance Criteria

### AC-1: 正常系 - 自分のプロフィール取得
```gherkin
Given ユーザーAがログイン済みである
When 自分のプロフィールを取得する
Then HTTPステータス200が返される
And ユーザー名、投稿数、フォロワー数、フォロー数が含まれる
And 応答時間がp95で300ミリ秒以内である
```

### AC-2: 正常系 - 他ユーザーのプロフィール取得
```gherkin
Given ユーザーAがログイン済みである
When ユーザーBのプロフィールを取得する
Then HTTPステータス200が返される
And ユーザーBの情報が返される
And is_followingフィールドが正しく設定されている
```

### AC-3: 異常系 - 存在しないユーザー
```gherkin
Given ユーザーがログイン済みである
When 存在しないユーザーIDでプロフィール取得を試みる
Then HTTPステータス404が返される
And エラーメッセージ "ユーザーが存在しません" が返される
```

### AC-4: パフォーマンス - キャッシング
```gherkin
Given 同じユーザーのプロフィールが60秒以内に2回取得される
When 2回目の取得を行う
Then Redisキャッシュからデータが返される
And DynamoDBへのクエリは実行されない
And 応答時間が100ミリ秒以内である
```

## Risks

- **R-1**: Social/Post Service障害時のレスポンス遅延
  - 対策: タイムアウト3秒設定、フォールバック値（count=0）返却

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で300ミリ秒以内
- [ ] コードレビューが完了し、承認されている
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
