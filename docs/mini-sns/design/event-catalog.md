# イベントカタログ

## 1. 概要

本ドキュメントは、Mini-SNSで使用されるすべてのドメインイベントのカタログです。
CloudEvents 1.0仕様に準拠し、サービス間の非同期通信に使用されます。

### 1.1 イベント駆動アーキテクチャの役割

- **疎結合**: サービス間の直接依存を排除
- **スケーラビリティ**: 非同期処理による負荷分散
- **拡張性**: 新しいConsumerを容易に追加可能
- **監査証跡**: すべてのビジネスイベントを記録

### 1.2 イベントバス構成

```
Producer Service → EventBridge Event Bus → EventBridge Rule → SQS Queue → Consumer Service
                                                            ↓
                                                         SQS DLQ
```

**EventBridge Bus**: `mini-sns-{env}-event-bus`

## 2. イベント一覧

| イベントタイプ | 発行者 | 購読者 | 優先度 | 順序保証 |
|--------------|-------|--------|-------|---------|
| `com.mini-sns.user.user.registered` | User Service | なし（将来: Notification Service） | Low | 不要 |
| `com.mini-sns.user.user.profileUpdated` | User Service | Timeline Service（キャッシュ更新） | Low | 不要 |
| `com.mini-sns.post.post.created` | Post Service | Timeline Service | High | 不要 |
| `com.mini-sns.post.post.deleted` | Post Service | Timeline Service, Social Service | High | 不要 |
| `com.mini-sns.social.follow.created` | Social Service | Timeline Service | Medium | 不要 |
| `com.mini-sns.social.follow.deleted` | Social Service | Timeline Service | Medium | 不要 |
| `com.mini-sns.social.like.created` | Social Service | なし（将来: Notification Service） | Low | 不要 |
| `com.mini-sns.social.like.deleted` | Social Service | なし | Low | 不要 |

## 3. イベント詳細仕様

### 3.1 User Service イベント

#### UserRegistered

**タイプ**: `com.mini-sns.user.user.registered`  
**バージョン**: v1  
**説明**: 新規ユーザーが登録された時に発行

**CloudEventsスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.user.user.registered",
  "source": "mini-sns/user-service",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "time": "2026-01-02T10:00:00Z",
  "datacontenttype": "application/json",
  "subject": "user:987fcdeb-51a2-43d7-9876-543210fedcba",
  "data": {
    "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "email": "user@example.com",
    "username": "johndoe",
    "registeredAt": "2026-01-02T10:00:00Z"
  }
}
```

**dataスキーマ**:
| フィールド | 型 | 必須 | 説明 |
|-----------|---|-----|------|
| userId | string (UUID) | ✓ | ユーザーID |
| email | string (email) | ✓ | メールアドレス |
| username | string | ✓ | ユーザー名 |
| registeredAt | string (ISO 8601) | ✓ | 登録日時 |

**発行タイミング**: Cognitoユーザー作成 + DynamoDBプロフィール保存完了後  
**発行頻度**: ユーザー登録時のみ（低頻度）  
**SLA**: 発行遅延 ≤ 500ms

**購読者**: なし（将来の機能用に予約）

---

#### UserProfileUpdated

**タイプ**: `com.mini-sns.user.user.profileUpdated`  
**バージョン**: v1  
**説明**: ユーザープロフィールが更新された時に発行

**CloudEventsスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.user.user.profileUpdated",
  "source": "mini-sns/user-service",
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "time": "2026-01-02T11:00:00Z",
  "datacontenttype": "application/json",
  "subject": "user:987fcdeb-51a2-43d7-9876-543210fedcba",
  "data": {
    "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "username": "johndoe_updated",
    "updatedAt": "2026-01-02T11:00:00Z",
    "changedFields": ["username"]
  }
}
```

**購読者**: Timeline Service（ユーザー情報キャッシュ無効化）

### 3.2 Post Service イベント

#### PostCreated

**タイプ**: `com.mini-sns.post.post.created`  
**バージョン**: v1  
**説明**: 新規投稿が作成された時に発行（最重要イベント）

**CloudEventsスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.post.post.created",
  "source": "mini-sns/post-service",
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "time": "2026-01-02T12:00:00Z",
  "datacontenttype": "application/json",
  "subject": "post:123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "postId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "content": "これはテスト投稿です",
    "createdAt": "2026-01-02T12:00:00Z"
  }
}
```

**dataスキーマ**:
| フィールド | 型 | 必須 | 説明 |
|-----------|---|-----|------|
| postId | string (UUID) | ✓ | 投稿ID |
| userId | string (UUID) | ✓ | 投稿者ID |
| content | string (1-280) | ✓ | 投稿内容 |
| createdAt | string (ISO 8601) | ✓ | 作成日時 |

**発行タイミング**: DynamoDB投稿保存完了直後  
**発行頻度**: 高頻度（5,000件/日想定）  
**SLA**: 
- 発行遅延 ≤ 500ms
- Timeline Service配信 ≤ 3秒（エンドツーエンド）

**購読者**: 
- **Timeline Service**: フォロワーのタイムラインに追加、WebSocket配信

**リトライ戦略**:
- SQS最大受信回数: 2回
- DLQ送信後アラート

**処理フロー**:
```
1. Post Service: 投稿をDynamoDBに保存
2. Post Service: PostCreatedイベント発行（EventBridge）
3. EventBridge: イベントルールでSQSにルーティング
4. Timeline Service: SQS Lambdaトリガーでイベント受信
5. Timeline Service: フォロワーリスト取得（Social Service API）
6. Timeline Service: 各フォロワーのタイムラインDynamoDBに書き込み
7. Timeline Service: Redisキャッシュ更新
8. Timeline Service: WebSocket API経由でリアルタイム配信
```

---

#### PostDeleted

**タイプ**: `com.mini-sns.post.post.deleted`  
**バージョン**: v1  
**説明**: 投稿が削除された時に発行

**CloudEventsスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.post.post.deleted",
  "source": "mini-sns/post-service",
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "time": "2026-01-02T13:00:00Z",
  "datacontenttype": "application/json",
  "subject": "post:123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "postId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "deletedAt": "2026-01-02T13:00:00Z",
    "reason": "user_request"
  }
}
```

**dataスキーマ**:
| フィールド | 型 | 必須 | 説明 |
|-----------|---|-----|------|
| postId | string (UUID) | ✓ | 削除された投稿ID |
| userId | string (UUID) | ✓ | 投稿者ID |
| deletedAt | string (ISO 8601) | ✓ | 削除日時 |
| reason | enum | × | 削除理由: `user_request`, `moderation`, `cascade` |

**購読者**:
- **Timeline Service**: タイムラインエントリ削除
- **Social Service**: いいねレコード削除（カスケード削除）

**SLA**: 配信遅延 ≤ 5秒

### 3.3 Social Service イベント

#### FollowCreated

**タイプ**: `com.mini-sns.social.follow.created`  
**バージョン**: v1  
**説明**: ユーザーが他のユーザーをフォローした時に発行

**CloudEventsスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.social.follow.created",
  "source": "mini-sns/social-service",
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "time": "2026-01-02T14:00:00Z",
  "datacontenttype": "application/json",
  "subject": "follow:follower:987fcdeb-51a2-43d7-9876-543210fedcba:followee:777fcdeb-51a2-43d7-9876-543210fedcba",
  "data": {
    "followId": "def12345-6789-0abc-def1-234567890abc",
    "followerId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "followeeId": "777fcdeb-51a2-43d7-9876-543210fedcba",
    "createdAt": "2026-01-02T14:00:00Z"
  }
}
```

**dataスキーマ**:
| フィールド | 型 | 必須 | 説明 |
|-----------|---|-----|------|
| followId | string (UUID) | ✓ | フォローID |
| followerId | string (UUID) | ✓ | フォローする側のユーザーID |
| followeeId | string (UUID) | ✓ | フォローされる側のユーザーID |
| createdAt | string (ISO 8601) | ✓ | フォロー日時 |

**購読者**:
- **Timeline Service**: フォロー対象の最新投稿をタイムラインに追加（最大20件）

**処理フロー**:
```
1. Social Service: フォロー関係をDynamoDBに保存
2. Social Service: FollowCreatedイベント発行
3. Timeline Service: イベント受信
4. Timeline Service: Post Service APIで最新投稿20件取得
5. Timeline Service: タイムラインDynamoDBに追加
6. Timeline Service: Redisキャッシュ更新
```

**SLA**: 配信遅延 ≤ 5秒

---

#### FollowDeleted

**タイプ**: `com.mini-sns.social.follow.deleted`  
**バージョン**: v1  
**説明**: ユーザーが他のユーザーをアンフォローした時に発行

**CloudEventsスキーマ**:
```json
{
  "specversion": "1.0",
  "type": "com.mini-sns.social.follow.deleted",
  "source": "mini-sns/social-service",
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "time": "2026-01-02T15:00:00Z",
  "datacontenttype": "application/json",
  "subject": "follow:follower:987fcdeb-51a2-43d7-9876-543210fedcba:followee:777fcdeb-51a2-43d7-9876-543210fedcba",
  "data": {
    "followId": "def12345-6789-0abc-def1-234567890abc",
    "followerId": "987fcdeb-51a2-43d7-9876-543210fedcba",
    "followeeId": "777fcdeb-51a2-43d7-9876-543210fedcba",
    "deletedAt": "2026-01-02T15:00:00Z"
  }
}
```

**購読者**:
- **Timeline Service**: フォロー対象の投稿をタイムラインから削除

---

#### LikeCreated / LikeDeleted

**タイプ**: `com.mini-sns.social.like.created` / `com.mini-sns.social.like.deleted`  
**バージョン**: v1  
**説明**: いいねの付与/削除時に発行

**購読者**: なし（現バージョン）  
**将来用途**: 通知サービスでいいね通知を送信

## 4. イベント配信設定

### 4.1 EventBridge ルール

#### PostCreated → Timeline Service

**ルール名**: `mini-sns-{env}-post-created-to-timeline`

**イベントパターン**:
```json
{
  "source": ["mini-sns/post-service"],
  "detail-type": ["com.mini-sns.post.post.created"]
}
```

**ターゲット**:
- SQS Queue: `mini-sns-{env}-timeline-events`
- DLQ: `mini-sns-{env}-timeline-dlq`

---

#### PostDeleted → Timeline Service & Social Service

**ルール名**: `mini-sns-{env}-post-deleted-to-consumers`

**イベントパターン**:
```json
{
  "source": ["mini-sns/post-service"],
  "detail-type": ["com.mini-sns.post.post.deleted"]
}
```

**ターゲット**:
- SQS Queue: `mini-sns-{env}-timeline-events`
- SQS Queue: `mini-sns-{env}-social-events`

### 4.2 SQS設定

**標準設定**（全キュー共通）:
- メッセージ保持期間: 14日
- 可視性タイムアウト: 30秒
- 最大受信回数: 2回
- DLQリダイレクト: 有効
- バッチサイズ: 10件
- バッチウィンドウ: 5秒

**FIFO設定**（将来対応）:
- 順序保証が必要な場合のみFIFOキューを使用
- メッセージグループID: `userId`（ユーザー単位で順序保証）
- コンテンツベース重複排除: 有効

### 4.3 パーティション戦略

現バージョンでは順序保証不要のため、パーティショニングは実施しません。

**将来対応** (SQS FIFO使用時):
- パーティションキー: `userId`
- 同一ユーザーのイベントは順序保証される
- 異なるユーザーのイベントは並列処理可能

## 5. 順序保証

### 5.1 現バージョン（順序保証なし）

- Standard SQSを使用
- イベント順序は保証されない
- Consumer側で冪等性を担保

**例**: FollowCreated → PostCreated → FollowDeleted の順序で発行されても、受信順序は保証されない

### 5.2 将来対応（部分的な順序保証）

SQS FIFOキューを使用して、同一ユーザーに関するイベントのみ順序保証

**メッセージグループID**: `userId`

**例**:
- UserA関連イベント: UserA-FollowCreated → UserA-PostCreated (順序保証)
- UserB関連イベント: UserB-PostCreated (並列処理)

## 6. 重複排除・冪等性

### 6.1 イベントID重複チェック

**DynamoDBテーブル**: `mini-sns-{env}-{service}-processed-events`

**スキーマ**:
| 属性 | 型 | 説明 |
|-----|---|------|
| eventId (PK) | String | CloudEventsのid |
| processedAt | String (ISO 8601) | 処理日時 |
| ttl | Number (UNIX timestamp) | TTL（24時間後に自動削除） |

**処理フロー**:
```python
def handle_event(event):
    event_id = event['id']
    
    # 条件付き書き込みで重複チェック
    try:
        dynamodb.put_item(
            TableName='processed-events',
            Item={
                'eventId': event_id,
                'processedAt': datetime.now().isoformat(),
                'ttl': int(time.time()) + 86400  # 24時間後
            },
            ConditionExpression='attribute_not_exists(eventId)'
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.info(f"Event {event_id} already processed")
            return  # 重複スキップ
        raise
    
    # ビジネスロジック実行
    process_business_logic(event)
```

### 6.2 SQS重複排除（FIFO使用時）

- **コンテンツベース重複排除**: 有効
- **重複排除ID**: CloudEventsの`id`フィールド
- **重複排除間隔**: 5分

## 7. バージョニング・スキーマ進化

### 7.1 スキーマ変更ポリシー

**後方互換性あり（minorバージョンアップ）**:
- フィールド追加（オプション）: OK
- 既存フィールドの型維持: OK

**破壊的変更（majorバージョンアップ）**:
- フィールド削除: NG → 新typeで発行
- フィールド名変更: NG → 新typeで発行
- フィールド型変更: NG → 新typeで発行

### 7.2 マイグレーション戦略

**v1 → v2移行例** (PostCreatedイベント):

**v1**:
```json
{
  "type": "com.mini-sns.post.post.created",
  "data": {
    "postId": "...",
    "userId": "...",
    "content": "..."
  }
}
```

**v2**（メディア対応追加）:
```json
{
  "type": "com.mini-sns.post.post.created.v2",
  "data": {
    "postId": "...",
    "userId": "...",
    "content": "...",
    "mediaUrls": []  // 新フィールド
  }
}
```

**移行期間**:
1. v2イベント発行開始（v1と並行発行、6ヶ月間）
2. Consumer側でv1・v2両方購読
3. 6ヶ月後にv1イベント発行停止
4. さらに6ヶ月後にv1 Consumer削除

## 8. モニタリング

### 8.1 CloudWatch Metrics

**カスタムメトリクス**:
- `Event.Published` (by event type)
- `Event.PublishLatency` (発行遅延)
- `Event.Consumed` (by event type)
- `Event.ConsumeLatency` (受信→処理完了までの遅延)
- `Event.DLQ.MessageCount` (DLQメッセージ数)
- `Event.DuplicateSkipped` (重複スキップ数)

### 8.2 アラート

**Critical**:
- `Event.DLQ.MessageCount > 0` (即座対応)
- `Event.PublishLatency > 1000ms` (5分間持続)
- `Event.ConsumeLatency > 10000ms` (PostCreatedイベント、5分間持続)

**Warning**:
- `Event.DuplicateSkipped > 100/hour` (重複が多発)

### 8.3 分散トレーシング

- X-Rayでイベント発行→受信→処理をトレース
- Correlation ID: CloudEventsの`id`を使用
- トレースID: AWS X-Rayの`X-Amzn-Trace-Id`ヘッダー

## 9. テスト戦略

### 9.1 イベントスキーマバリデーション

**JSON Schemaによる検証**:
```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

const postCreatedSchema = {
  type: 'object',
  required: ['specversion', 'type', 'source', 'id', 'time', 'data'],
  properties: {
    specversion: { const: '1.0' },
    type: { const: 'com.mini-sns.post.post.created' },
    source: { const: 'mini-sns/post-service' },
    id: { type: 'string', format: 'uuid' },
    time: { type: 'string', format: 'date-time' },
    data: {
      type: 'object',
      required: ['postId', 'userId', 'content', 'createdAt'],
      properties: {
        postId: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        content: { type: 'string', minLength: 1, maxLength: 280 },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

const validate = ajv.compile(postCreatedSchema);
const isValid = validate(event);
if (!isValid) {
  console.error(validate.errors);
}
```

### 9.2 エンドツーエンドテスト

**シナリオ**: 投稿作成→タイムライン配信

```python
def test_post_created_event_flow():
    # 1. 投稿作成
    post = create_post(user_id, "テスト投稿")
    
    # 2. EventBridge経由でイベント発行確認（LocalStack）
    events = get_published_events(event_type='com.mini-sns.post.post.created')
    assert len(events) == 1
    assert events[0]['data']['postId'] == post['id']
    
    # 3. Timeline Serviceがイベント受信・処理
    wait_for_event_processing(timeout=5)
    
    # 4. フォロワーのタイムラインに追加確認
    timeline = get_timeline(follower_user_id)
    assert post['id'] in [p['id'] for p in timeline['posts']]
    
    # 5. WebSocket配信確認
    ws_messages = get_websocket_messages(follower_connection_id)
    assert any(m['postId'] == post['id'] for m in ws_messages)
```

## 10. 参考資料

- [CloudEvents Specification v1.0](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md)
- [AWS EventBridge Event Patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
- [Event-Driven Architecture Best Practices](https://aws.amazon.com/event-driven-architecture/)
