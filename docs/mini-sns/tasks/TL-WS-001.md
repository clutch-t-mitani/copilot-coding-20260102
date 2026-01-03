# [Implement] WebSocket接続機能

Task-ID: TL-WS-001  
Service: timeline-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/timeline-service/**/*.md

## Purpose

クライアントとのWebSocket接続を確立・管理し、リアルタイムタイムライン更新の基盤を提供する。

## Scope

### 含まれる範囲
- WebSocket API（WSS /ws）の実装
- WebSocket接続管理（$connect, $disconnect, $default）
- 接続情報のRedis保存
- JWT認証処理（接続時）
- Ping/Pong ハートビート（30秒間隔）
- アイドルタイムアウト（10分）

### 含まれない範囲（Non-Scope）
- リアルタイム配信ロジック（TL-RT-001で実装）
- タイムライン取得機能（TL-GET-001で実装）

## Contracts

### 入力
- **WebSocket接続**: WSS /ws?token={jwt_token}
- **クエリパラメータ**: token (JWTトークン)

### 出力
- **接続成功**: WebSocket接続確立
- **接続失敗**: 401 Unauthorized

### Redis保存データ
```json
{
  "connectionId": "abc123",
  "userId": "uuid",
  "connectedAt": "2026-01-03T00:00:00Z"
}
```
- **キー**: `ws:connection:{connectionId}`
- **TTL**: 10分（アイドルタイムアウト）

## Steps

### 1. Scaffold
- [ ] WebSocket API Lambda関数ディレクトリ作成
- [ ] 必要な依存関係の定義

### 2. API & Data
- [ ] API Gateway WebSocket API定義（Terraform）
- [ ] Lambda関数（$connect, $disconnect, $default）作成
- [ ] Redisクライアント初期化

### 3. Business Logic
- [ ] $connect ハンドラー実装
  - クエリパラメータからJWTトークン取得
  - Cognitoトークン検証
  - ユーザーID抽出
  - Redis保存（connectionId → userId マッピング）
- [ ] $disconnect ハンドラー実装
  - Redisから接続情報削除
- [ ] $default ハンドラー実装（Ping/Pong）
  - Ping受信時にPong返信
  - 接続のTTL更新（Redis）
- [ ] エラーハンドリング
  - 無効なトークン（401）
  - Redis障害時のフォールバック

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: 有効なトークンでの接続成功
  - 異常系: 無効なトークンでの接続失敗（401）
  - 正常系: 切断時のRedis削除確認
- [ ] 統合テスト
  - E2E: WebSocket接続→Ping/Pong→切断

## Acceptance Criteria

### AC-1: 正常系 - WebSocket接続成功
```gherkin
Given ユーザーが有効なJWTトークンを持っている
When WebSocket接続を試行する（WSS /ws?token={jwt}）
Then WebSocket接続が確立される
And Redisに接続情報が保存される
And 接続IDが返される
```

### AC-2: 異常系 - 無効なトークン
```gherkin
Given ユーザーが無効なJWTトークンを持っている
When WebSocket接続を試行する
Then HTTPステータス401が返される
And WebSocket接続は確立されない
```

### AC-3: 正常系 - 切断処理
```gherkin
Given ユーザーがWebSocket接続中である
When クライアントが切断する
Then $disconnectハンドラーが呼び出される
And Redisから接続情報が削除される
```

### AC-4: 正常系 - Ping/Pong
```gherkin
Given ユーザーがWebSocket接続中である
When クライアントがPingを送信する
Then サーバーがPongを返信する
And Redis TTLが更新される（10分延長）
```

### AC-5: セキュリティ - 認証必須
```gherkin
Given トークンなしでWebSocket接続を試行する
When 接続リクエストを送信する
Then HTTPステータス401が返される
```

## Risks

- **R-1**: 同時接続数増加によるRedis負荷
  - 対策: Redis Clusterモード、接続数制限（1,000同時接続）
- **R-2**: WebSocket接続タイムアウト
  - 対策: Ping/Pongによるハートビート、自動再接続（クライアント側）
- **R-3**: Redis障害時の接続管理失敗
  - 対策: フォールバック（DynamoDB使用）、アラート設定

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] WebSocket接続が安定している（切断率 < 1%）
- [ ] 同時接続数1,000をサポートできる
- [ ] コードレビュー完了
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
- [ ] CloudWatchアラーム設定が完了している（切断率 > 10%）
