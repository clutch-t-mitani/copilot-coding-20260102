# [Implement] アンフォロー機能

Task-ID: SOC-FOL-002  
Service: social-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/social-service/**/*.md

## Purpose

ユーザーが他のユーザーをアンフォローできる機能を実装する。

## Scope

### 含まれる範囲
- DELETE /users/{userId}/follow エンドポイントの実装
- DynamoDBからのフォロー関係削除
- FollowDeletedイベントの発行

### 含まれない範囲（Non-Scope）
- フォロー機能（SOC-FOL-001で実装）

## Contracts

### 入力
- **HTTPリクエスト**: DELETE /users/{userId}/follow
- **ヘッダー**: Authorization: Bearer {token}

### 出力
- **成功時（204 No Content）**: レスポンスボディなし

### イベント
- **発行**: FollowDeleted イベント

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] DynamoDB DeleteItem実装

### 3. Business Logic
- [ ] アンフォロービジネスロジック実装
  - フォロー関係確認
  - DynamoDB DeleteItem実行
- [ ] FollowDeletedイベント発行
- [ ] エラーハンドリング（404: フォロー関係が存在しない）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト（正常系、異常系）
- [ ] 統合テスト

## Acceptance Criteria

### AC-1: 正常系 - アンフォロー成功
```gherkin
Given ユーザーAがユーザーBをフォロー中である
When ユーザーBをアンフォローする
Then HTTPステータス204が返される
And DynamoDBからフォロー関係が削除される
And FollowDeletedイベントが発行される
```

### AC-2: 異常系 - フォローしていないユーザー
```gherkin
Given ユーザーAがユーザーBをフォローしていない
When ユーザーBをアンフォローしようとする
Then HTTPステータス404が返される
```

## Risks

- **R-1**: タイムライン削除の遅延
  - 対策: Timeline Serviceでのイベント処理確認

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] コードレビュー完了
