# マイクロサービス間インタフェース仕様

## 1. 概要

本ドキュメントでは、Mini-SNSのマイクロサービス間における通信インタフェースを定義します。
サービス間通信は、同期（REST API）と非同期（イベント）の2つのパターンで行われます。

### 1.1 設計原則

- **契約ファースト**: インタフェースを先に定義し、Consumer Driven Contractで検証
- **疎結合**: サービス間の直接的な依存を避け、イベント駆動で協調
- **バージョン管理**: セマンティックバージョニングによる後方互換性維持
- **タイムアウト管理**: 明確なタイムアウト値とリトライ戦略
- **監視**: すべてのサービス間通信を分散トレーシングで追跡

## 2. 同期通信（REST API）

### 2.1 通信パターン

| 呼び出し元 | 呼び出し先 | 目的 | タイムアウト | リトライ |
|-----------|-----------|------|------------|---------|
| Timeline Service | Post Service | 投稿詳細取得 | 10秒 | 3回 |
| Timeline Service | User Service | ユーザー情報取得 | 10秒 | 3回 |
| Social Service | User Service | ユーザー存在確認 | 5秒 | 3回 |
| Social Service | Post Service | 投稿存在確認 | 5秒 | 3回 |

### 2.2 Timeline Service → Post Service

#### エンドポイント: GET /posts/{postId}

**目的**: タイムライン表示時に投稿詳細を取得

**リクエスト**:
```http
GET /posts/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: post-service-internal.mini-sns.local
Authorization: Bearer {service-token}
X-Request-ID: {uuid}
X-Correlation-ID: {correlation-id}
```

**レスポンス** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
  "content": "これはテスト投稿です",
  "likesCount": 42,
  "createdAt": "2026-01-02T10:00:00Z",
  "updatedAt": "2026-01-02T10:00:00Z"
}
```

**エラーハンドリング**:
- 404 Not Found: 投稿が削除された場合、タイムラインから除外
- 500 Internal Server Error: リトライ（指数バックオフ: 1s, 2s, 4s）
- タイムアウト (10秒): サーキットブレーカー起動、投稿をスキップ

**SLA**:
- p95レイテンシ: ≤ 100ms
- 可用性: 99.9%
- エラー率: < 0.5%

### 2.3 Timeline Service → User Service

#### エンドポイント: GET /users/{userId}

**目的**: タイムライン表示時に投稿著者情報を取得

**リクエスト**:
```http
GET /users/987fcdeb-51a2-43d7-9876-543210fedcba HTTP/1.1
Host: user-service-internal.mini-sns.local
Authorization: Bearer {service-token}
X-Request-ID: {uuid}
X-Correlation-ID: {correlation-id}
```

**レスポンス** (200 OK):
```json
{
  "id": "987fcdeb-51a2-43d7-9876-543210fedcba",
  "email": "user@example.com",
  "username": "johndoe",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

**キャッシュ戦略**:
- Timeline ServiceはユーザーT情報をRedisにキャッシュ（TTL: 300秒）
- キャッシュキー: `user:{userId}`

**SLA**:
- p95レイテンシ: ≤ 50ms
- 可用性: 99.9%
- エラー率: < 0.5%

### 2.4 バッチAPI（効率化）

#### エンドポイント: POST /posts/batch

**目的**: 複数投稿を一括取得（N+1問題回避）

**リクエスト**:
```http
POST /posts/batch HTTP/1.1
Host: post-service-internal.mini-sns.local
Content-Type: application/json
Authorization: Bearer {service-token}

{
  "postIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "223e4567-e89b-12d3-a456-426614174001"
  ]
}
```

**レスポンス** (200 OK):
```json
{
  "posts": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
      "content": "投稿1",
      "likesCount": 10,
      "createdAt": "2026-01-02T10:00:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "userId": "887fcdeb-51a2-43d7-9876-543210fedcba",
      "content": "投稿2",
      "likesCount": 5,
      "createdAt": "2026-01-02T11:00:00Z"
    }
  ],
  "notFound": []
}
```

**制約**:
- 最大100件まで一括取得可能
- タイムアウト: 15秒

### 2.5 認証・認可

**サービス間認証**:
- AWS IAM署名（SigV4）または Service-to-Service JWT
- Lambda実行ロールによる権限管理

**リクエストヘッダー**:
```http
Authorization: Bearer {service-token}
X-Request-ID: {uuid}          # リクエスト識別子
X-Correlation-ID: {uuid}      # 相関ID（分散トレーシング用）
X-Service-Name: timeline-service
```

### 2.6 サーキットブレーカー

**設定**:
- 失敗閾値: 連続5回失敗
- オープン時間: 30秒
- ハーフオープン試行: 1リクエスト
- タイムアウト: 10秒

**実装**: AWS Lambda Powertools Circuit Breaker または独自実装

## 3. 非同期通信（イベント）

### 3.1 イベント駆動アーキテクチャ

```
Post Service → EventBridge → SQS Queue → Timeline Service
                          → SQS Queue → Social Service
```

### 3.2 イベントスキーマ（CloudEvents準拠）

すべてのイベントはCloudEvents 1.0仕様に準拠します。

**共通フィールド**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.{service}.{entity}.{action}",
  "source": "mini-sns/{service}",
  "id": "{uuid}",
  "time": "{ISO 8601 timestamp}",
  "datacontenttype": "application/json",
  "subject": "{entity-id}",
  "data": { ... }
}
```

### 3.3 Post Service発行イベント

#### イベント: PostCreated

**type**: `com.mini-sns.post.post.created`

**フルスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.post.post.created",
  "source": "mini-sns/post-service",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "time": "2026-01-02T10:00:00Z",
  "datacontenttype": "application/json",
  "subject": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "postId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "content": "これはテスト投稿です",
    "createdAt": "2026-01-02T10:00:00Z"
  }
}
```

**購読者**:
- Timeline Service: タイムラインに追加、WebSocket配信

**配信保証**: At-least-once（重複可能性あり）

**SLA**:
- イベント発行遅延: ≤ 500ms（投稿保存後）
- 配信遅延: ≤ 3秒（Timeline Serviceまで）

#### イベント: PostDeleted

**type**: `com.mini-sns.post.post.deleted`

**フルスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.post.post.deleted",
  "source": "mini-sns/post-service",
  "id": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
  "time": "2026-01-02T11:00:00Z",
  "datacontenttype": "application/json",
  "subject": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "postId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "deletedAt": "2026-01-02T11:00:00Z"
  }
}
```

**購読者**:
- Timeline Service: タイムラインから削除
- Social Service: いいねレコード削除

### 3.4 Social Service発行イベント

#### イベント: FollowCreated

**type**: `com.mini-sns.social.follow.created`

**フルスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.social.follow.created",
  "source": "mini-sns/social-service",
  "id": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
  "time": "2026-01-02T12:00:00Z",
  "datacontenttype": "application/json",
  "subject": "follower:987fcdeb-51a2-43d7-9876-543210fedcba:followee:777fcdeb-51a2-43d7-9876-543210fedcba",
  "data": {
    "followId": "def12345-6789-0abc-def1-234567890abc",
    "followerId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "followeeId": "777fcdeb-51a2-43d7-9876-543210fedcba",
    "createdAt": "2026-01-02T12:00:00Z"
  }
}
```

**購読者**:
- Timeline Service: フォロー対象の最新投稿をタイムラインに追加

#### イベント: FollowDeleted

**type**: `com.mini-sns.social.follow.deleted`

**購読者**:
- Timeline Service: フォロー対象の投稿をタイムラインから削除

#### イベント: LikeCreated / LikeDeleted

**type**: `com.mini-sns.social.like.created` / `com.mini-sns.social.like.deleted`

**購読者**: （現バージョンではなし、将来の通知機能で使用予定）

### 3.5 User Service発行イベント

#### イベント: UserRegistered

**type**: `com.mini-sns.user.user.registered`

**購読者**: （現バージョンではなし、将来のウェルカムメール送信で使用予定）

### 3.6 イベント配信設定

#### SQS設定

**キュー名**: `mini-sns-{env}-{consumer-service}-events`

例: `mini-sns-prod-timeline-events`

**パラメータ**:
- 可視性タイムアウト: 30秒
- メッセージ保持期間: 14日
- 最大受信回数: 2回（DLQへ移動）
- バッチサイズ: 10件
- バッチウィンドウ: 5秒

**DLQ**: `mini-sns-{env}-{consumer-service}-dlq`

#### EventBridgeルール

**ルール名**: `mini-sns-{env}-{event-type}-to-{consumer}`

例: `mini-sns-prod-post-created-to-timeline`

**イベントパターン**:
```json
{
  "source": ["mini-sns/post-service"],
  "detail-type": ["com.mini-sns.post.post.created"]
}
```

**ターゲット**: SQS Queue

### 3.7 重複排除・冪等性

**Idempotency-Key**:
- イベントIDをIdempotency-Keyとして使用
- Consumer側でDynamoDBに処理済みイベントIDを記録
- TTL: 24時間

**実装例** (Timeline Service):
```python
def handle_post_created(event):
    event_id = event['id']
    
    # 重複チェック
    if is_processed(event_id):
        logger.info(f"Event {event_id} already processed, skipping")
        return
    
    # タイムライン更新処理
    update_timeline(event['data'])
    
    # 処理済み記録
    mark_as_processed(event_id)
```

### 3.8 順序保証

**現バージョン**: 順序保証なし（Standard SQS使用）

**将来対応**: SQS FIFOキューで順序保証（ユーザーIDをグループIDとする）

### 3.9 エラーハンドリング

**リトライ戦略**:
1. SQSが自動リトライ（可視性タイムアウト後）
2. 最大2回受信後、DLQに移動
3. DLQ監視アラート（CloudWatch Alarms）
4. 手動リカバリー手順（Runbook参照）

**Poison Message対策**:
- メッセージサイズ上限: 256KB
- バリデーション失敗時は即座にDLQへ移動（リトライ不要）

## 4. バージョニング戦略

### 4.1 セマンティックバージョニング

**形式**: `{major}.{minor}.{patch}`

- **major**: 破壊的変更（後方互換性なし）
- **minor**: 新機能追加（後方互換性あり）
- **patch**: バグ修正（後方互換性あり）

### 4.2 API バージョニング

**URL バージョニング**: `/v1/posts`, `/v2/posts`

**ヘッダーバージョニング**: `Accept: application/vnd.mini-sns.v1+json`

**廃止ポリシー**:
- 新バージョンリリース後、旧バージョンを最低6ヶ月サポート
- 廃止予定の3ヶ月前に警告ヘッダー追加: `Sunset: Sun, 01 Jul 2026 00:00:00 GMT`

### 4.3 イベントバージョニング

**type フィールドにバージョン含める**: `com.mini-sns.post.post.created.v2`

**後方互換性維持**:
- フィールド追加はOK（Consumer側でオプション扱い）
- フィールド削除・名称変更は破壊的変更（新typeで発行）

**マイグレーション期間**:
- v1とv2を並行発行（6ヶ月間）
- Consumer側で両方購読
- 6ヶ月後にv1廃止

## 5. モニタリング・SLA

### 5.1 同期API SLA

| サービス | エンドポイント | p95レイテンシ | 可用性 | エラー率 |
|---------|--------------|-------------|-------|---------|
| Post Service | GET /posts/{id} | ≤ 100ms | 99.9% | < 0.5% |
| User Service | GET /users/{id} | ≤ 50ms | 99.9% | < 0.5% |
| Post Service | POST /posts/batch | ≤ 200ms | 99.9% | < 0.5% |

### 5.2 非同期イベントSLA

| イベント | 発行遅延 | 配信遅延 | 配信成功率 |
|---------|---------|---------|-----------|
| PostCreated | ≤ 500ms | ≤ 3秒 | 99.9% |
| PostDeleted | ≤ 500ms | ≤ 5秒 | 99.9% |
| FollowCreated | ≤ 500ms | ≤ 5秒 | 99.9% |

### 5.3 監視メトリクス

**CloudWatch Metrics**:
- `ServiceCall.Latency` (by target service)
- `ServiceCall.Errors` (by error type)
- `ServiceCall.CircuitBreakerOpen`
- `Event.Published` (by event type)
- `Event.Consumed` (by event type)
- `Event.DLQ.MessageCount`

**X-Ray トレーシング**:
- すべてのサービス間呼び出しをトレース
- サンプリングレート: 5%（通常）、100%（エラー時）

### 5.4 アラート

**重大度: Critical**:
- DLQメッセージ数 > 0（即座対応）
- サービス間API可用性 < 99%（5分間持続）
- サーキットブレーカーオープン（5分間持続）

**重大度: Warning**:
- サービス間APIレイテンシ p95 > SLA（10分間持続）
- イベント配信遅延 > SLA（10分間持続）

## 6. 契約テスト（Consumer Driven Contract）

### 6.1 Pact による契約テスト

**Provider側**（Post Service）:
```javascript
// pact-verification.spec.js
const { Verifier } = require('@pact-foundation/pact');

describe('Post Service Contract Verification', () => {
  it('validates contracts from Timeline Service', () => {
    return new Verifier({
      provider: 'PostService',
      providerBaseUrl: 'http://localhost:3001',
      pactUrls: ['./pacts/timeline-service-post-service.json'],
    }).verifyProvider();
  });
});
```

**Consumer側**（Timeline Service）:
```javascript
// timeline.pact.spec.js
const { PactV3 } = require('@pact-foundation/pact');

describe('Timeline Service - Post Service Contract', () => {
  const provider = new PactV3({
    consumer: 'TimelineService',
    provider: 'PostService',
  });

  it('should get post by ID', () => {
    return provider
      .given('post exists')
      .uponReceiving('a request for post details')
      .withRequest({
        method: 'GET',
        path: '/posts/123e4567-e89b-12d3-a456-426614174000',
      })
      .willRespondWith({
        status: 200,
        body: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: string(),
          content: string(),
          likesCount: integer(),
          createdAt: iso8601DateTime(),
        },
      })
      .executeTest(async (mockServer) => {
        const post = await timelineService.getPost(mockServer.url, postId);
        expect(post.id).toBe(postId);
      });
  });
});
```

### 6.2 契約テスト実行タイミング

- **Provider側**: 毎回のデプロイ前にCI/CDで実行
- **Consumer側**: Pull Request作成時に実行
- **Pact Broker**: 契約ファイルの中央管理（Pactflowまたはセルフホスト）

## 7. 参考資料

- [CloudEvents Specification](https://cloudevents.io/)
- [Pact Documentation](https://docs.pact.io/)
- [AWS EventBridge Best Practices](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-best-practices.html)
- [Microservices Patterns - Service Communication](https://microservices.io/patterns/communication-style/messaging.html)
