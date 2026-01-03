# [Implement] フォロー・フォロワーリスト取得機能

Task-ID: SOC-LIST-001  
Service: social-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/social-service/**/*.md

## Purpose

ユーザーのフォローリストとフォロワーリストを取得する機能を実装する。

## Scope

### 含まれる範囲
- GET /users/{userId}/following エンドポイントの実装
- GET /users/{userId}/followers エンドポイントの実装
- DynamoDBクエリによるリスト取得
- ページネーション対応

### 含まれない範囲（Non-Scope）
- フォロー・アンフォロー機能（別タスクで実装）

## Contracts

### 入力
- **HTTPリクエスト**: GET /users/{userId}/following?limit=20
- **HTTPリクエスト**: GET /users/{userId}/followers?limit=20

### 出力
- **成功時（200 OK）**:
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "testuser"
    }
  ],
  "total": 10
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB Query実装（forward/reverse index）

### 3. Business Logic
- [ ] フォローリスト取得ロジック実装
- [ ] フォロワーリスト取得ロジック実装
- [ ] ページネーション処理

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト（正常系、境界値）
- [ ] 統合テスト

## Acceptance Criteria

### AC-1: 正常系 - フォローリスト取得
```gherkin
Given ユーザーAが3人をフォローしている
When GET /users/{userIdA}/followingを呼び出す
Then HTTPステータス200が返される
And 3人のユーザー情報が返される
```

### AC-2: 正常系 - フォロワーリスト取得
```gherkin
Given ユーザーBが5人にフォローされている
When GET /users/{userIdB}/followersを呼び出す
Then HTTPステータス200が返される
And 5人のユーザー情報が返される
```

## Risks

- **R-1**: 大量フォロワー時のクエリ遅延
  - 対策: ページネーション、limit上限100件

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] API応答時間がp95で200ミリ秒以内
- [ ] コードレビュー完了
