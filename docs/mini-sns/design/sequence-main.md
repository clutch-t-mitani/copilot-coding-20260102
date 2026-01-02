# 主要フロー シーケンス図

## 1. 概要

Mini-SNSの主要ユースケースにおける晴天シナリオと雨天シナリオのシーケンス図を示します。

## 2. ユーザー登録フロー

### 2.1 晴天シナリオ（正常系）

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant APIGW as API Gateway
    participant UserSvc as User Service
    participant Cognito as Amazon Cognito
    participant DDB as User DynamoDB
    participant EB as EventBridge

    Client->>+APIGW: POST /auth/register<br/>{email, username, password}
    APIGW->>+UserSvc: invoke Lambda
    
    UserSvc->>UserSvc: バリデーション<br/>(email形式、パスワード長)
    
    UserSvc->>+Cognito: CreateUser<br/>(email, password)
    Cognito-->>-UserSvc: userId, success
    
    UserSvc->>+DDB: PutItem<br/>{PK: USER#userId, SK: PROFILE}
    Note over UserSvc,DDB: GSI設定（email, username）
    DDB-->>-UserSvc: success
    
    UserSvc->>+EB: PutEvents<br/>UserRegistered event
    EB-->>-UserSvc: eventId
    
    UserSvc->>+Cognito: InitiateAuth<br/>(email, password)
    Cognito-->>-UserSvc: JWT token
    
    UserSvc-->>-APIGW: 201 Created<br/>{user, token}
    APIGW-->>-Client: 201 Created<br/>{user, token}
    
    Note over Client: ログイン完了<br/>ホーム画面へ遷移
```

**所要時間**: p95 ≤ 1.5秒

### 2.2 雨天シナリオ（重複メールアドレス）

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant UserSvc as User Service
    participant Cognito
    
    Client->>+APIGW: POST /auth/register<br/>{email: existing@example.com}
    APIGW->>+UserSvc: invoke Lambda
    
    UserSvc->>+Cognito: CreateUser
    Cognito-->>-UserSvc: UsernameExistsException
    
    UserSvc-->>-APIGW: 409 Conflict<br/>{type: "conflict", detail: "Email already exists"}
    APIGW-->>-Client: 409 Conflict
    
    Note over Client: エラーメッセージ表示<br/>「このメールアドレスは既に使用されています」
```

**エラー処理**: リトライ不要（クライアント側で別メールアドレス入力）

## 3. 投稿作成→タイムライン配信フロー

### 3.1 晴天シナリオ（正常系）

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant PostSvc as Post Service
    participant PostDDB as Post DynamoDB
    participant EB as EventBridge
    participant SQS
    participant TimelineSvc as Timeline Service
    participant TimelineDDB as Timeline DynamoDB
    participant Redis
    participant WSS as WebSocket API
    participant Follower as フォロワー

    Client->>+APIGW: POST /posts<br/>{content, Idempotency-Key}
    Note over APIGW: JWT認証<br/>(Cognito Authorizer)
    APIGW->>+PostSvc: invoke Lambda
    
    PostSvc->>PostSvc: バリデーション<br/>(1-280文字)
    PostSvc->>PostSvc: XSS サニタイゼーション
    
    PostSvc->>+PostDDB: PutItem<br/>{PK: POST#postId}
    PostDDB-->>-PostSvc: success
    
    PostSvc->>+EB: PutEvents<br/>PostCreated event
    EB-->>-PostSvc: eventId
    Note over EB: 発行遅延: ≤ 500ms
    
    PostSvc-->>-APIGW: 201 Created<br/>{postId, content}
    APIGW-->>-Client: 201 Created
    
    Note over Client: 投稿成功<br/>UI更新
    
    EB->>+SQS: route PostCreated event
    SQS-->>-EB: messageId
    
    SQS->>+TimelineSvc: trigger Lambda<br/>(batch: 10 events)
    
    TimelineSvc->>TimelineSvc: 重複チェック<br/>(eventId in ProcessedEvents)
    
    TimelineSvc->>TimelineSvc: フォロワーリスト取得<br/>(Social Service API 呼び出し)<br/>または キャッシュ使用
    
    loop 各フォロワー
        TimelineSvc->>+TimelineDDB: PutItem<br/>{PK: USER#followerId, SK: POST#timestamp#postId}
        TimelineDDB-->>-TimelineSvc: success
        
        TimelineSvc->>+Redis: ZADD timeline:{followerId}<br/>score: timestamp, value: postId
        Redis-->>-TimelineSvc: success
        
        TimelineSvc->>+WSS: send message<br/>to connectionId
        WSS-->>Follower: {type: "new_post", post}
        WSS-->>-TimelineSvc: success
    end
    
    Note over Follower: リアルタイム更新<br/>タイムラインに投稿表示
    
    TimelineSvc-->>-SQS: delete message
    
    Note over PostSvc,Follower: エンドツーエンド: ≤ 3秒
```

**SLA**:
- 投稿作成API応答: p95 ≤ 500ms
- PostCreatedイベント発行遅延: ≤ 500ms
- タイムライン配信遅延（WebSocket）: ≤ 3秒（エンドツーエンド）

### 3.2 雨天シナリオ（Timeline Service 処理失敗）

```mermaid
sequenceDiagram
    participant SQS
    participant TimelineSvc as Timeline Service
    participant TimelineDDB as Timeline DynamoDB
    participant DLQ
    
    SQS->>+TimelineSvc: PostCreated event
    
    TimelineSvc->>+TimelineDDB: PutItem (follower 1)
    TimelineDDB-->>-TimelineSvc: success
    
    TimelineSvc->>+TimelineDDB: PutItem (follower 2)
    TimelineDDB-->>-TimelineSvc: ProvisionedThroughputExceededException
    
    TimelineSvc-->>-SQS: throw error
    
    Note over SQS: 可視性タイムアウト後<br/>リトライ（30秒後）
    
    SQS->>+TimelineSvc: PostCreated event (2回目)
    TimelineSvc->>TimelineSvc: 重複チェック<br/>(follower 1 は処理済みスキップ)
    TimelineSvc->>+TimelineDDB: PutItem (follower 2)
    TimelineDDB-->>-TimelineSvc: success
    TimelineSvc-->>-SQS: success
    
    alt 最大受信回数超過（3回失敗）
        SQS->>+DLQ: move message
        DLQ-->>-SQS: success
        Note over DLQ: CloudWatch Alarm発火<br/>オペレーター通知
    end
```

**リトライ戦略**:
- 最大受信回数: 2回
- 可視性タイムアウト: 30秒
- DLQ移動後: 手動リカバリー（Runbook参照）

## 4. タイムライン取得フロー

### 4.1 晴天シナリオ（キャッシュヒット）

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant TimelineSvc as Timeline Service
    participant Redis
    participant PostSvc as Post Service
    participant UserSvc as User Service
    
    Client->>+APIGW: GET /timeline?limit=20
    Note over APIGW: JWT認証
    APIGW->>+TimelineSvc: invoke Lambda
    
    TimelineSvc->>+Redis: ZREVRANGE timeline:{userId} 0 19
    Redis-->>-TimelineSvc: [postId1, postId2, ...]
    Note over Redis: キャッシュヒット（TTL: 60秒）
    
    par 投稿詳細取得（並列）
        TimelineSvc->>+PostSvc: GET /posts/batch<br/>[postId1, postId2, ...]
        PostSvc-->>-TimelineSvc: [{post1}, {post2}, ...]
    and ユーザー情報取得（並列）
        TimelineSvc->>+UserSvc: GET /users/batch<br/>[userId1, userId2, ...]
        UserSvc-->>-TimelineSvc: [{user1}, {user2}, ...]
    end
    
    TimelineSvc->>TimelineSvc: マージ処理<br/>(post + author情報)
    
    TimelineSvc-->>-APIGW: 200 OK<br/>{posts, total, cachedAt}
    APIGW-->>-Client: 200 OK
    
    Note over Client: タイムライン表示
```

**所要時間**: p95 ≤ 250ms（キャッシュヒット時）

### 4.2 雨天シナリオ（キャッシュミス + Post Service タイムアウト）

```mermaid
sequenceDiagram
    participant TimelineSvc as Timeline Service
    participant Redis
    participant TimelineDDB as Timeline DynamoDB
    participant PostSvc as Post Service
    
    TimelineSvc->>+Redis: ZREVRANGE timeline:{userId}
    Redis-->>-TimelineSvc: [] (キャッシュミス)
    
    TimelineSvc->>+TimelineDDB: Query<br/>PK=USER#{userId}, Limit=20
    TimelineDDB-->>-TimelineSvc: [postIds]
    
    TimelineSvc->>+PostSvc: GET /posts/batch<br/>(タイムアウト設定: 10秒)
    Note over PostSvc: レスポンス遅延
    PostSvc-->>-TimelineSvc: Timeout (10秒経過)
    
    TimelineSvc->>TimelineSvc: サーキットブレーカー<br/>連続失敗回数カウント
    
    TimelineSvc->>TimelineSvc: フォールバック処理<br/>投稿IDのみ返却（詳細なし）
    
    TimelineSvc-->>TimelineSvc: 200 OK<br/>{posts: [], error: "partial_data"}
    
    Note over TimelineSvc: リトライ（指数バックオフ）<br/>1s, 2s, 4s
    
    alt サーキットブレーカー オープン（5回連続失敗）
        Note over TimelineSvc: 30秒間リクエスト遮断<br/>その後ハーフオープン
    end
```

**エラーハンドリング**:
- タイムアウト: 10秒
- リトライ: 3回（指数バックオフ）
- サーキットブレーカー: 5回失敗で30秒オープン

## 5. フォロー作成→タイムライン更新フロー

### 5.1 晴天シナリオ（正常系）

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant SocialSvc as Social Service
    participant SocialDDB as Social DynamoDB
    participant EB as EventBridge
    participant SQS
    participant TimelineSvc as Timeline Service
    participant PostSvc as Post Service
    participant TimelineDDB as Timeline DynamoDB
    
    Client->>+APIGW: POST /users/{followeeId}/follow<br/>{Idempotency-Key}
    APIGW->>+SocialSvc: invoke Lambda
    
    SocialSvc->>SocialSvc: 自己フォロー確認<br/>(followerId ≠ followeeId)
    
    SocialSvc->>+SocialDDB: PutItem<br/>{PK: USER#followerId, SK: FOLLOW#followeeId}<br/>ConditionExpression: attribute_not_exists(PK)
    SocialDDB-->>-SocialSvc: success
    
    SocialSvc->>+EB: PutEvents<br/>FollowCreated event
    EB-->>-SocialSvc: eventId
    
    SocialSvc-->>-APIGW: 201 Created<br/>{followId, followeeId}
    APIGW-->>-Client: 201 Created
    
    Note over Client: フォローボタン<br/>「フォロー中」に変更
    
    EB->>+SQS: route FollowCreated event
    SQS->>+TimelineSvc: trigger Lambda
    
    TimelineSvc->>+PostSvc: GET /users/{followeeId}/posts?limit=20
    PostSvc-->>-TimelineSvc: [post1, post2, ...]
    
    loop 取得した投稿（最大20件）
        TimelineSvc->>+TimelineDDB: PutItem<br/>{PK: USER#followerId, SK: POST#...}
        TimelineDDB-->>-TimelineSvc: success
    end
    
    TimelineSvc->>TimelineSvc: Redisキャッシュ更新
    
    TimelineSvc-->>-SQS: delete message
    
    Note over Client: タイムライン自動更新<br/>フォロー対象の投稿表示
```

**所要時間**: フォローAPI応答 ≤ 1秒、タイムライン更新 ≤ 5秒

### 5.2 雨天シナリオ（重複フォロー）

```mermaid
sequenceDiagram
    participant Client
    participant APIGW
    participant SocialSvc as Social Service
    participant SocialDDB
    
    Client->>+APIGW: POST /users/{followeeId}/follow<br/>(既にフォロー済み)
    APIGW->>+SocialSvc: invoke Lambda
    
    SocialSvc->>+SocialDDB: PutItem<br/>ConditionExpression: attribute_not_exists(PK)
    SocialDDB-->>-SocialSvc: ConditionalCheckFailedException
    
    SocialSvc-->>-APIGW: 409 Conflict<br/>{type: "conflict", detail: "Already following"}
    APIGW-->>-Client: 409 Conflict
    
    Note over Client: エラーメッセージ<br/>「既にフォローしています」
```

**冪等性**: Idempotency-Keyチェック + 条件付き書き込みで重複防止

## 6. エラーシナリオ共通パターン

### 6.1 認証エラー（401 Unauthorized）

```mermaid
sequenceDiagram
    participant Client
    participant APIGW
    participant Cognito
    
    Client->>+APIGW: GET /timeline<br/>Authorization: Bearer {expired_token}
    APIGW->>+Cognito: ValidateToken
    Cognito-->>-APIGW: TokenExpiredException
    APIGW-->>-Client: 401 Unauthorized<br/>{type: "unauthorized", detail: "Token expired"}
    
    Note over Client: リフレッシュトークンで再認証<br/>または ログイン画面へ遷移
```

### 6.2 レート制限エラー（429 Too Many Requests）

```mermaid
sequenceDiagram
    participant Client
    participant APIGW
    participant PostSvc
    
    Client->>+APIGW: POST /posts (11回目/分)
    Note over APIGW: レート制限チェック<br/>(10 posts/min)
    APIGW-->>-Client: 429 Too Many Requests<br/>{type: "rate_limit_exceeded", retryAfter: 45}
    
    Note over Client: エラーメッセージ表示<br/>「投稿制限に達しました。<br/>45秒後に再試行してください」
```

### 6.3 データベースエラー（500 Internal Server Error）

```mermaid
sequenceDiagram
    participant APIGW
    participant Service as Any Service
    participant DDB as DynamoDB
    participant CloudWatch
    participant Sentry
    
    APIGW->>+Service: invoke Lambda
    Service->>+DDB: Query
    DDB-->>-Service: InternalServerError
    
    Service->>Service: リトライ（3回、指数バックオフ）
    Service->>+DDB: Query (2回目)
    DDB-->>-Service: InternalServerError
    
    Service->>+CloudWatch: put metric<br/>ServiceError: 1
    CloudWatch-->>-Service: success
    
    Service->>+Sentry: capture exception
    Sentry-->>-Service: eventId
    
    Service-->>-APIGW: 500 Internal Server Error<br/>{type: "internal_error", traceId, retryable: true}
    
    Note over CloudWatch: エラー率アラート発火<br/>(> 1% for 5分)
```

## 7. パフォーマンス最適化フロー

### 7.1 バッチAPI活用（N+1問題回避）

**Before**（N+1問題）:
```
Timeline Service → Post Service: GET /posts/postId1 (100ms)
Timeline Service → Post Service: GET /posts/postId2 (100ms)
...
Timeline Service → Post Service: GET /posts/postId20 (100ms)
合計: 20 × 100ms = 2,000ms
```

**After**（バッチAPI）:
```
Timeline Service → Post Service: POST /posts/batch [postId1, ..., postId20] (200ms)
合計: 200ms
```

**改善率**: 90% レイテンシ削減

### 7.2 Redis キャッシュ活用

```mermaid
sequenceDiagram
    participant TimelineSvc
    participant Redis
    participant DDB
    
    TimelineSvc->>+Redis: GET timeline:{userId}
    alt キャッシュヒット
        Redis-->>-TimelineSvc: [cached data] (5ms)
        Note over TimelineSvc: p95: 250ms
    else キャッシュミス
        Redis-->>TimelineSvc: null
        TimelineSvc->>+DDB: Query
        DDB-->>-TimelineSvc: [data] (50ms)
        TimelineSvc->>+Redis: SET timeline:{userId} [data] EX 60
        Redis-->>-TimelineSvc: OK
        Note over TimelineSvc: p95: 500ms（初回のみ）
    end
```

**キャッシュヒット率目標**: ≥ 80%

## 8. 参考資料

- [マイクロサービスパターン - サーキットブレーカー](https://microservices.io/patterns/reliability/circuit-breaker.html)
- [AWS Well-Architected Framework - Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
