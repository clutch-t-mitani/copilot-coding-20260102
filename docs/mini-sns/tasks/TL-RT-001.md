# [Implement] リアルタイム配信機能

Task-ID: TL-RT-001  
Service: timeline-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/timeline-service/**/*.md

## Purpose

新規投稿をフォロワーにリアルタイムでWebSocket経由で配信する機能を実装する。3秒以内の配信遅延を実現する。

## Scope

### 含まれる範囲
- WebSocket配信ロジックの実装
- PostCreatedイベント購読処理との連携
- Social Service API呼び出し（フォロワーリスト取得）
- Redis接続情報取得
- API Gateway Management API使用（WebSocket送信）
- 配信失敗時のリトライ処理

### 含まれない範囲（Non-Scope）
- WebSocket接続管理（TL-WS-001で実装）
- イベント購読処理（TL-EVENT-001で実装）

## Contracts

### 入力（内部関数）
- PostCreatedイベントデータ
```json
{
  "postId": "uuid",
  "userId": "uuid",
  "content": "投稿内容",
  "createdAt": "2026-01-03T00:00:00Z"
}
```

### 出力（WebSocket送信）
```json
{
  "type": "newPost",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "content": "投稿内容",
    "author": {
      "id": "uuid",
      "username": "testuser"
    },
    "likes_count": 0,
    "created_at": "2026-01-03T00:00:00Z"
  }
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ハンドラーファイルの作成

### 2. API & Data
- [ ] API Gateway Management APIクライアント初期化
- [ ] Redisクライアント初期化

### 3. Business Logic
- [ ] リアルタイム配信ビジネスロジック実装
  - PostCreatedイベントデータ受信
  - Social Service API呼び出し（GET /users/{userId}/followers）
  - フォロワーのユーザーIDリスト取得
  - Redis並列クエリ（各フォロワーの接続ID取得）
  - User Service API呼び出し（著者情報取得）
  - WebSocketメッセージ構築
  - API Gateway Management API並列呼び出し（各接続IDへ送信）
  - 配信失敗した接続IDのRedis削除（切断済み）
- [ ] エラーハンドリング
  - Social Service障害時のスキップ
  - WebSocket送信失敗時のリトライ（2回）
- [ ] パフォーマンス最適化
  - 並列処理（Promise.all）
  - バッチサイズ制限（100接続ごと）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 投稿作成からWebSocket配信まで
  - 正常系: 複数フォロワーへの並列配信
  - 異常系: Social Service障害時のスキップ
  - 異常系: WebSocket送信失敗時のリトライ
- [ ] 統合テスト
  - E2E: 投稿作成→イベント発行→リアルタイム配信→クライアント受信
  - 性能テスト: 100人のフォロワーへの配信が3秒以内

## Acceptance Criteria

### AC-1: 正常系 - リアルタイム配信
```gherkin
Given ユーザーAがタイムラインを開いている（WebSocket接続中）
And ユーザーAがユーザーBをフォローしている
When ユーザーBが新規投稿を作成する
Then 3秒以内にユーザーAのタイムラインに新規投稿が配信される
And WebSocket経由で投稿データが受信される
```

### AC-2: パフォーマンス - 複数フォロワー配信
```gherkin
Given ユーザーBが100人のフォロワーを持っている
And 全フォロワーがWebSocket接続中である
When ユーザーBが新規投稿を作成する
Then 全フォロワーに3秒以内に投稿が配信される
```

### AC-3: 異常系 - 切断済み接続の処理
```gherkin
Given フォロワーの一部が既にWebSocket切断済みである
When 新規投稿が作成される
Then 接続中のフォロワーにのみ配信される
And 切断済み接続IDはRedisから削除される
And エラーログが記録される
```

### AC-4: 異常系 - Social Service障害
```gherkin
Given Social Serviceがダウンしている
When 新規投稿が作成される
Then 配信処理がスキップされる
And エラーログが記録される
And システムは正常動作を続ける
```

## Risks

- **R-1**: 大量フォロワーへの配信遅延
  - 対策: バッチサイズ制限（100接続ごと）、並列処理、3秒以内目標
- **R-2**: WebSocket送信失敗によるメッセージロスト
  - 対策: リトライ2回、DLQ送信、クライアント側のポーリングフォールバック
- **R-3**: Redis障害時の配信失敗
  - 対策: アラート設定、フォールバック（DynamoDB使用）

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] 配信遅延がp95で3秒以内
- [ ] 100人のフォロワーへの配信が3秒以内
- [ ] コードレビュー完了
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
- [ ] CloudWatchアラーム設定が完了している（配信失敗率 > 5%）
