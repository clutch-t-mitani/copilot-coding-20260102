# データモデル設計（DynamoDB）

## 1. 概要

Mini-SNSは**Database per Service**パターンを採用し、各マイクロサービスが独立したDynamoDBテーブルを保有します。

### 1.1 テーブル一覧

| サービス | テーブル名 | 主要エンティティ | アクセスパターン数 |
|---------|-----------|-----------------|------------------|
| User Service | `mini-sns-{env}-user-ddb` | User | 3 |
| Post Service | `mini-sns-{env}-post-ddb` | Post | 4 |
| Social Service | `mini-sns-{env}-social-ddb` | Follow, Like | 6 |
| Timeline Service | `mini-sns-{env}-timeline-ddb` | TimelineEntry | 2 |

## 2. User Service テーブル

### 2.1 テーブル仕様

**テーブル名**: `mini-sns-{env}-user-ddb`

**キー設計**:
- **PK (Partition Key)**: `USER#{userId}`
- **SK (Sort Key)**: `PROFILE`

**GSI (Global Secondary Index)**:
- **GSI1**: `email-index`
  - PK: `email`
  - SK: なし
- **GSI2**: `username-index`
  - PK: `username`
  - SK: なし

### 2.2 アイテム構造

```json
{
  "PK": "USER#987fcdeb-51a2-43d7-9876-543210fedcba",
  "SK": "PROFILE",
  "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
  "email": "user@example.com",
  "username": "johndoe",
  "createdAt": "2026-01-02T10:00:00Z",
  "updatedAt": "2026-01-02T10:00:00Z",
  "GSI1PK": "user@example.com",
  "GSI2PK": "johndoe"
}
```

### 2.3 アクセスパターン

| ID | パターン | キー使用 | 推定RCU/WCU |
|----|---------|---------|------------|
| AP-U1 | ユーザーIDでプロフィール取得 | PK=USER#{userId}, SK=PROFILE | 1 RCU |
| AP-U2 | メールアドレスでユーザー検索 | GSI1 (email-index) | 1 RCU |
| AP-U3 | ユーザー名でユーザー検索 | GSI2 (username-index) | 1 RCU |

### 2.4 容量見積り

- **想定アイテム数**: 1,000ユーザー
- **アイテムサイズ**: 平均0.5KB
- **総容量**: 0.5MB
- **書き込み**: 10 WCU（ピーク時）
- **読み込み**: 50 RCU（ピーク時）

## 3. Post Service テーブル

### 3.1 テーブル仕様

**テーブル名**: `mini-sns-{env}-post-ddb`

**キー設計**:
- **PK**: `POST#{postId}`
- **SK**: `METADATA`

**GSI**:
- **GSI1**: `user-posts-index`
  - PK: `USER#{userId}`
  - SK: `createdAt`（降順）

### 3.2 アイテム構造

```json
{
  "PK": "POST#123e4567-e89b-12d3-a456-426614174000",
  "SK": "METADATA",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
  "content": "これはテスト投稿です",
  "likesCount": 42,
  "createdAt": "2026-01-02T12:00:00Z",
  "updatedAt": "2026-01-02T12:00:00Z",
  "GSI1PK": "USER#987fcdeb-51a2-43d7-9876-543210fedcba",
  "GSI1SK": "2026-01-02T12:00:00Z"
}
```

### 3.3 アクセスパターン

| ID | パターン | キー使用 | 推定RCU/WCU |
|----|---------|---------|------------|
| AP-P1 | 投稿IDで投稿取得 | PK=POST#{postId}, SK=METADATA | 1 RCU |
| AP-P2 | ユーザーの投稿一覧取得 | GSI1 (user-posts-index, PK=USER#{userId}) | 2 RCU (20件取得) |
| AP-P3 | 投稿作成 | PK=POST#{postId}, SK=METADATA | 1 WCU |
| AP-P4 | 投稿削除 | PK=POST#{postId}, SK=METADATA | 1 WCU |

### 3.4 容量見積り

- **想定アイテム数**: 5,000投稿/日 × 30日 = 150,000投稿
- **アイテムサイズ**: 平均1KB
- **総容量**: 150MB
- **書き込み**: 6 WCU（平均）、20 WCU（ピーク時）
- **読み込み**: 100 RCU（タイムライン取得が主）

## 4. Social Service テーブル

### 4.1 テーブル仕様

**テーブル名**: `mini-sns-{env}-social-ddb`

**単一テーブル設計** (Single Table Design)

**キー設計**:
- **PK**: エンティティタイプ + ID
- **SK**: 関連エンティティ + ID

**GSI**:
- **GSI1**: `reverse-index`（フォロー/いいねの逆引き用）
  - PK: `GSI1PK`
  - SK: `GSI1SK`

### 4.2 アイテム構造

#### Followアイテム

```json
{
  "PK": "USER#987fcdeb-51a2-43d7-9876-543210fedcba",
  "SK": "FOLLOW#777fcdeb-51a2-43d7-9876-543210fedcba",
  "entityType": "FOLLOW",
  "followId": "def12345-6789-0abc-def1-234567890abc",
  "followerId": "987fcdeb-51a2-43d7-9876-543210fedcba",
  "followeeId": "777fcdeb-51a2-43d7-9876-543210fedcba",
  "createdAt": "2026-01-02T14:00:00Z",
  "GSI1PK": "USER#777fcdeb-51a2-43d7-9876-543210fedcba",
  "GSI1SK": "FOLLOWER#987fcdeb-51a2-43d7-9876-543210fedcba"
}
```

#### Likeアイテム

```json
{
  "PK": "USER#987fcdeb-51a2-43d7-9876-543210fedcba",
  "SK": "LIKE#123e4567-e89b-12d3-a456-426614174000",
  "entityType": "LIKE",
  "likeId": "abc12345-6789-0def-abc1-234567890def",
  "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-01-02T15:00:00Z",
  "GSI1PK": "POST#123e4567-e89b-12d3-a456-426614174000",
  "GSI1SK": "LIKE#987fcdeb-51a2-43d7-9876-543210fedcba"
}
```

### 4.3 アクセスパターン

| ID | パターン | キー使用 | 推定RCU/WCU |
|----|---------|---------|------------|
| AP-S1 | ユーザーのフォロー一覧取得 | PK=USER#{followerId}, SK begins_with FOLLOW# | 2 RCU |
| AP-S2 | ユーザーのフォロワー一覧取得 | GSI1 (PK=USER#{followeeId}, SK begins_with FOLLOWER#) | 2 RCU |
| AP-S3 | フォロー関係確認 | PK=USER#{followerId}, SK=FOLLOW#{followeeId} | 1 RCU |
| AP-S4 | フォロー作成 | PK=USER#{followerId}, SK=FOLLOW#{followeeId} | 1 WCU |
| AP-S5 | ユーザーがいいねした投稿一覧 | PK=USER#{userId}, SK begins_with LIKE# | 2 RCU |
| AP-S6 | 投稿のいいね一覧取得 | GSI1 (PK=POST#{postId}, SK begins_with LIKE#) | 2 RCU |

### 4.4 容量見積り

- **Followアイテム数**: 1,000ユーザー × 平均3フォロー = 3,000アイテム
- **Likeアイテム数**: 150,000投稿 × 平均2いいね = 300,000アイテム
- **総アイテム数**: 303,000アイテム
- **総容量**: 約150MB
- **書き込み**: 5 WCU（平均）、15 WCU（ピーク時）
- **読み込み**: 50 RCU

## 5. Timeline Service テーブル

### 5.1 テーブル仕様

**テーブル名**: `mini-sns-{env}-timeline-ddb`

**キー設計**:
- **PK**: `USER#{userId}`
- **SK**: `POST#{createdAt}#{postId}`（新しい順にソート）

### 5.2 アイテム構造

```json
{
  "PK": "USER#987fcdeb-51a2-43d7-9876-543210fedcba",
  "SK": "POST#2026-01-02T12:00:00Z#123e4567-e89b-12d3-a456-426614174000",
  "userId": "987fcdeb-51a2-43d7-9876-543210fedcba",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "authorId": "777fcdeb-51a2-43d7-9876-543210fedcba",
  "deliveredAt": "2026-01-02T12:00:05Z",
  "ttl": 1738504805
}
```

**TTL**: 30日後に自動削除

### 5.3 アクセスパターン

| ID | パターン | キー使用 | 推定RCU/WCU |
|----|---------|---------|------------|
| AP-T1 | タイムライン取得（最新20件） | PK=USER#{userId}, SK descending, Limit=20 | 2 RCU |
| AP-T2 | タイムラインエントリ追加 | PK=USER#{userId}, SK=POST#{createdAt}#{postId} | 1 WCU |

### 5.4 容量見積り

- **想定アイテム数**: 1,000ユーザー × 平均100エントリ = 100,000アイテム
- **総容量**: 約50MB（TTL自動削除により）
- **書き込み**: 50 WCU（ピーク時、PostCreatedイベント処理）
- **読み込み**: 100 RCU（タイムライン取得）

## 6. エンティティ関連図（テキスト表現）

```
[User] 1 --- * [Post]
  |              |
  | *          * |
[Follow]      [Like]
  |              |
  |              |
[Timeline] * --- 1 [Post]
```

**関係性**:
- User 1:N Post（1人のユーザーは複数の投稿を持つ）
- User M:N User via Follow（ユーザー間のフォロー関係）
- User M:N Post via Like（ユーザーと投稿のいいね関係）
- User 1:N Timeline（1人のユーザーは1つのタイムラインを持つ）

## 7. データ整合性戦略

### 7.1 結果整合性（Eventual Consistency）

- **PostCreated → Timeline更新**: 非同期（EventBridge経由、3秒以内）
- **FollowCreated → Timeline更新**: 非同期（EventBridge経由、5秒以内）
- **PostDeleted → Like削除**: 非同期（EventBridge経由、5秒以内）

### 7.2 強整合性（Strong Consistency）

- **User登録**: Cognito + DynamoDB同期書き込み（トランザクション）
- **投稿作成**: DynamoDB書き込み + イベント発行（同期）
- **フォロー/いいね**: DynamoDB書き込み（条件付き書き込みで重複防止）

### 7.3 制約

- **一意制約**: 
  - User.email（GSI1で実現）
  - User.username（GSI2で実現）
  - Follow (followerId, followeeId)（PKとSKの組み合わせで実現）
  - Like (userId, postId)（PKとSKの組み合わせで実現）

- **外部キー制約**: なし（NoSQLのため、アプリケーション層で整合性担保）

## 8. TTL（Time To Live）設定

| テーブル | TTL属性 | 保持期間 | 理由 |
|---------|--------|---------|------|
| User | なし | 永続 | ユーザーデータは削除しない |
| Post | なし | 永続 | 投稿は明示的削除のみ |
| Social | なし | 永続 | フォロー・いいねは明示的削除のみ |
| Timeline | `ttl` | 30日 | 古いタイムラインエントリは自動削除 |
| Processed Events | `ttl` | 24時間 | イベント重複チェック用、短期保存 |

## 9. バックアップ・復旧

### 9.1 Point-in-Time Recovery (PITR)

- **有効化**: すべてのテーブルでPITR有効
- **保持期間**: 35日
- **RPO**: 5分
- **RTO**: 1時間（手動復旧）

### 9.2 オンデマンドバックアップ

- **頻度**: 月次（手動）
- **保持期間**: 90日
- **用途**: 長期保存、監査証跡

## 10. モニタリング

### 10.1 CloudWatch Metrics

- **ConsumedReadCapacityUnits**: RCU使用量
- **ConsumedWriteCapacityUnits**: WCU使用量
- **UserErrors**: クライアントエラー（バリデーション失敗など）
- **SystemErrors**: サーバーエラー
- **ThrottledRequests**: スロットリング発生数

### 10.2 アラート

- **ThrottledRequests > 0**: Critical（即座対応）
- **SystemErrors > 10/分**: Critical（即座対応）
- **ConsumedReadCapacityUnits > 80%**: Warning（容量計画見直し）

## 11. 参考資料

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [DynamoDB Capacity Modes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
