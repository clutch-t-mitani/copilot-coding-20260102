# [Implement] フォロー機能

Task-ID: SOC-FOL-001  
Service: social-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/social-service/**/*.md

## Purpose

ユーザーが他のユーザーをフォローできる機能を実装する。フォロー関係を管理し、タイムライン生成の基盤を提供する。

## Scope

### 含まれる範囲
- POST /users/{userId}/follow エンドポイントの実装
- DynamoDBへのフォロー関係保存
- 重複フォロー防止
- 自分自身のフォロー防止
- FollowCreatedイベントの発行
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- アンフォロー機能（SOC-FOL-002で実装）
- フォローリクエスト承認機能（将来の拡張）
- DynamoDBテーブル作成（SOC-DDB-001で実装）

## Contracts

### 入力
- **HTTPリクエスト**: POST /users/{userId}/follow
- **ヘッダー**: Authorization: Bearer {token}
- **パスパラメータ**: userId (フォロー対象のユーザーID)

### 出力
- **成功時（201 Created）**:
```json
{
  "follower_id": "uuid",
  "followee_id": "uuid",
  "created_at": "2026-01-03T00:00:00Z"
}
```
- **エラー時（400/401/409/500）**: エラーメッセージ

### イベント
- **発行**: FollowCreated イベント（EventBridge経由）
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.social.follow.created",
  "source": "social-service",
  "id": "uuid",
  "time": "2026-01-03T00:00:00Z",
  "data": {
    "followerId": "uuid",
    "followeeId": "uuid",
    "createdAt": "2026-01-03T00:00:00Z"
  }
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ディレクトリ構成の作成
- [ ] 必要な依存関係の定義

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] Lambda関数エントリーポイントの作成
- [ ] DynamoDBクライアント初期化

### 3. Business Logic
- [ ] フォロービジネスロジック実装
  - JWTトークンからフォロワーユーザーID抽出
  - 自分自身のフォロー確認（follower_id != followee_id）
  - User Service API呼び出し（フォロー対象ユーザー存在確認）
  - 重複フォローチェック（DynamoDBクエリ）
  - DynamoDB PutItem（PK: USER#{followerId}, SK: FOLLOW#{followeeId}）
  - GSI書き込み（reverse-index）
- [ ] FollowCreatedイベント発行処理
- [ ] エラーハンドリング
  - 自分自身のフォロー（400）
  - 存在しないユーザー（404）
  - 既にフォロー済み（409）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 有効なユーザーのフォロー成功
  - 異常系: 自分自身のフォロー試行で失敗（400）
  - 異常系: 重複フォローで失敗（409）
  - 異常系: 存在しないユーザーのフォロー失敗（404）
- [ ] 統合テスト
  - E2E: フォローからイベント発行、Timeline Serviceでの受信まで

## Acceptance Criteria

### AC-1: 正常系 - ユーザーのフォロー
```gherkin
Given ユーザーAがログイン済みである
And ユーザーBをフォローしていない
When ユーザーBをフォローする
Then HTTPステータス201が返される
And DynamoDBにフォロー関係が保存される
And FollowCreatedイベントが1秒以内に発行される
And 応答時間がp95で500ミリ秒以内である
```

### AC-2: 異常系 - 自分自身のフォロー
```gherkin
Given ユーザーAがログイン済みである
When 自分自身をフォローしようとする
Then HTTPステータス400が返される
And エラーメッセージ "自分自身をフォローできません" が返される
And DynamoDBにレコードは作成されない
```

### AC-3: 異常系 - 重複フォロー
```gherkin
Given ユーザーAが既にユーザーBをフォローしている
When 再度ユーザーBをフォローしようとする
Then HTTPステータス409が返される
And エラーメッセージ "既にフォロー済みです" が返される
And DynamoDBに重複レコードは作成されない
```

### AC-4: イベント発行確認
```gherkin
Given ユーザーがフォローに成功した
When EventBridgeのイベントログを確認する
Then FollowCreatedイベントが発行されている
And イベントにfollowerId、followeeIdが含まれる
```

## Risks

- **R-1**: User Service障害時のフォロー失敗
  - 対策: タイムアウト3秒、リトライ3回、適切なエラーメッセージ
- **R-2**: 大量フォロー操作によるスパム
  - 対策: レート制限（10フォロー/分/ユーザー）

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビュー完了
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
