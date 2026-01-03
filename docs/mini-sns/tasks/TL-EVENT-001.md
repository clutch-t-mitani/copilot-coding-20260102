# [Implement] イベント購読処理

Task-ID: TL-EVENT-001  
Service: timeline-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/solutions/timeline-service/**/*.md

## Purpose

EventBridge経由でPostCreated、FollowCreated、FollowDeletedイベントを購読し、タイムラインを更新する処理を実装する。

## Scope

### 含まれる範囲
- EventBridge + SQS購読設定（Terraform）
- PostCreatedイベントハンドラー実装
- FollowCreatedイベントハンドラー実装
- FollowDeletedイベントハンドラー実装
- DynamoDBタイムラインテーブル更新
- Redisキャッシュ無効化
- DLQ設定とエラーハンドリング

### 含まれない範囲（Non-Scope）
- リアルタイム配信ロジック（TL-RT-001で実装）
- イベント発行側の実装（Post/Social Serviceの責務）

## Contracts

### 入力イベント

**PostCreated**:
```json
{
  "type": "com.mini-sns.post.created",
  "data": {
    "postId": "uuid",
    "userId": "uuid",
    "content": "投稿内容",
    "createdAt": "2026-01-03T00:00:00Z"
  }
}
```

**FollowCreated**:
```json
{
  "type": "com.mini-sns.social.follow.created",
  "data": {
    "followerId": "uuid",
    "followeeId": "uuid",
    "createdAt": "2026-01-03T00:00:00Z"
  }
}
```

**FollowDeleted**:
```json
{
  "type": "com.mini-sns.social.follow.deleted",
  "data": {
    "followerId": "uuid",
    "followeeId": "uuid"
  }
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ディレクトリ作成（eventHandlers/）
- [ ] SQS→Lambda統合設定

### 2. API & Data
- [ ] EventBridge Rule定義（Terraform）
- [ ] SQS Queue作成（DLQ含む）
- [ ] Lambda関数（各イベントハンドラー）作成

### 3. Business Logic
- [ ] PostCreatedハンドラー実装
  - Social Service API呼び出し（フォロワーリスト取得）
  - 各フォロワーのタイムラインにDynamoDB書き込み
  - Redisキャッシュ無効化
  - リアルタイム配信関数呼び出し（TL-RT-001）
- [ ] FollowCreatedハンドラー実装
  - Post Service API呼び出し（最新20件取得）
  - フォロワーのタイムラインにDynamoDB書き込み
  - Redisキャッシュ無効化
- [ ] FollowDeletedハンドラー実装
  - フォロワーのタイムラインからDynamoDB削除
  - Redisキャッシュ無効化
- [ ] エラーハンドリング
  - リトライ処理（最大2回）
  - DLQ送信（リトライ失敗時）
  - 冪等性制御（重複イベント処理防止）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: PostCreatedイベント処理
  - 正常系: FollowCreatedイベント処理
  - 正常系: FollowDeletedイベント処理
  - 異常系: 外部サービス障害時のリトライ
  - 正常系: 冪等性（重複イベント処理）
- [ ] 統合テスト
  - E2E: PostCreatedイベント→タイムライン更新→配信

## Acceptance Criteria

### AC-1: 正常系 - PostCreatedイベント処理
```gherkin
Given ユーザーBが新規投稿を作成した
And PostCreatedイベントが発行された
When Timeline Serviceがイベントを受信する
Then ユーザーBのフォロワー全員のタイムラインが更新される
And 処理が3秒以内に完了する
```

### AC-2: 正常系 - FollowCreatedイベント処理
```gherkin
Given ユーザーAがユーザーBをフォローした
And FollowCreatedイベントが発行された
When Timeline Serviceがイベントを受信する
Then ユーザーAのタイムラインにユーザーBの最新20件が追加される
```

### AC-3: 正常系 - FollowDeletedイベント処理
```gherkin
Given ユーザーAがユーザーBをアンフォローした
And FollowDeletedイベントが発行された
When Timeline Serviceがイベントを受信する
Then ユーザーAのタイムラインからユーザーBの投稿が削除される
```

### AC-4: 冪等性 - 重複イベント処理
```gherkin
Given PostCreatedイベントが2回配信された（重複）
When Timeline Serviceが両方のイベントを処理する
Then タイムラインに投稿は1回のみ追加される
And 重複処理がスキップされる
```

### AC-5: 異常系 - リトライとDLQ
```gherkin
Given Social Service APIが一時的にダウンしている
When PostCreatedイベントを処理しようとする
Then 2回リトライされる
And リトライ失敗後DLQに送信される
And CloudWatchにエラーログが記録される
```

## Risks

- **R-1**: イベント処理遅延によるタイムライン更新遅延
  - 対策: SQS可視性タイムアウト30秒、並列処理、モニタリング
- **R-2**: 大量イベント時のDynamoDB書き込みスロットリング
  - 対策: オンデマンドキャパシティモード、バッチ書き込み
- **R-3**: 冪等性制御の実装漏れ
  - 対策: イベントID管理（Redis、TTL=24時間）

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] イベント処理時間がp95で3秒以内
- [ ] コードレビュー完了
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
- [ ] DLQアラーム設定が完了している（メッセージ数 > 0）
