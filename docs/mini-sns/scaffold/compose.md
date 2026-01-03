# Docker Compose 運用ガイド

## 概要

ローカル開発環境として、DynamoDB Local, Redis, LocalStack を Docker Compose
で提供。

## サービス構成

### 1. DynamoDB Local

**イメージ**: `amazon/dynamodb-local:latest`

**ポート**: `8000`

**用途**:

- ユーザー情報（User Service）
- 投稿（Post Service）
- フォロー・いいね（Social Service）
- タイムライン（Timeline Service）

**エンドポイント**: `http://localhost:8000`

**データ永続化**: `dynamodb-data` ボリューム

### 2. Redis

**イメージ**: `redis:7-alpine`

**ポート**: `6379`

**用途**:

- タイムラインキャッシュ
- WebSocket 接続管理

**エンドポイント**: `redis://localhost:6379`

**データ永続化**: `redis-data` ボリューム

**ヘルスチェック**: `redis-cli ping`

### 3. LocalStack

**イメージ**: `localstack/localstack:latest`

**ポート**: `4566` (Gateway)

**用途**:

- Lambda ローカル実行
- EventBridge イベントバス
- Cognito ユーザープール
- SQS キュー

**エンドポイント**: `http://localhost:4566`

**サポートサービス**:

- `dynamodb` (DynamoDB)
- `s3` (S3)
- `lambda` (Lambda)
- `apigateway` (API Gateway)
- `cloudwatch` (CloudWatch)
- `eventbridge` (EventBridge)
- `cognito-idp` (Cognito)
- `sqs` (SQS)

## 起動・停止

### 起動

```bash
# 全サービス起動
docker compose up -d

# 特定サービスのみ起動
docker compose up -d mini-sns-dynamodb mini-sns-redis

# ログ表示
docker compose logs -f
```

### 停止

```bash
# 全サービス停止
docker compose down

# データボリューム削除（注意: データが消えます）
docker compose down -v
```

### 再起動

```bash
docker compose restart
```

## 状態確認

### サービス状態

```bash
docker compose ps
```

### ログ確認

```bash
# 全サービス
docker compose logs

# 特定サービス
docker compose logs mini-sns-dynamodb
docker compose logs mini-sns-redis
docker compose logs mini-sns-localstack

# リアルタイムログ
docker compose logs -f
```

### ヘルスチェック

```bash
# Redis
docker compose exec mini-sns-redis redis-cli ping
# 期待値: PONG

# DynamoDB Local
curl http://localhost:8000/
# 期待値: 404 (正常)

# LocalStack
curl http://localhost:4566/_localstack/health
# 期待値: JSON レスポンス
```

## DynamoDB Local 操作

### AWS CLI 経由

```bash
# テーブル一覧
aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1

# テーブル作成（例: User テーブル）
aws dynamodb create-table \
  --table-name mini-sns-dev-user-ddb \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1

# アイテム挿入
aws dynamodb put-item \
  --table-name mini-sns-dev-user-ddb \
  --item '{"PK":{"S":"USER#123"},"SK":{"S":"PROFILE"},"username":{"S":"testuser"}}' \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1

# アイテム取得
aws dynamodb get-item \
  --table-name mini-sns-dev-user-ddb \
  --key '{"PK":{"S":"USER#123"},"SK":{"S":"PROFILE"}}' \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1
```

### SDK 経由（TypeScript）

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});
```

## Redis 操作

### Redis CLI

```bash
# Redis コンテナに接続
docker compose exec mini-sns-redis redis-cli

# キー確認
127.0.0.1:6379> KEYS *

# キャッシュ設定
127.0.0.1:6379> SET user:123 '{"id":"123","username":"test"}'
127.0.0.1:6379> EXPIRE user:123 300

# キャッシュ取得
127.0.0.1:6379> GET user:123

# 全削除
127.0.0.1:6379> FLUSHALL
```

### SDK 経由（TypeScript）

```typescript
import { createClient } from 'redis';

const client = createClient({
  url: 'redis://localhost:6379',
});

await client.connect();
await client.set('user:123', JSON.stringify({ id: '123', username: 'test' }));
const user = await client.get('user:123');
```

## LocalStack 操作

### EventBridge

```bash
# イベントバス作成
aws events create-event-bus \
  --name mini-sns-dev-event-bus \
  --endpoint-url http://localhost:4566

# イベント送信
aws events put-events \
  --entries '[{"Source":"user-service","DetailType":"UserRegistered","Detail":"{\"userId\":\"123\"}","EventBusName":"mini-sns-dev-event-bus"}]' \
  --endpoint-url http://localhost:4566
```

### Cognito

```bash
# ユーザープール作成
aws cognito-idp create-user-pool \
  --pool-name mini-sns-dev-user-pool \
  --endpoint-url http://localhost:4566
```

## トラブルシューティング

### DynamoDB Local が起動しない

```bash
# ポート競合確認
lsof -i :8000

# コンテナ再作成
docker compose down
docker compose up -d mini-sns-dynamodb
```

### Redis 接続エラー

```bash
# ヘルスチェック
docker compose exec mini-sns-redis redis-cli ping

# ログ確認
docker compose logs mini-sns-redis
```

### LocalStack が遅い

LocalStack はリソース消費が大きいため、必要なサービスのみ有効化：

```yaml
environment:
  - SERVICES=dynamodb,eventbridge,cognito-idp
```

## データリセット

```bash
# 全データ削除（ボリューム削除）
docker compose down -v

# 再起動
docker compose up -d
```

## 本番環境との差異

### DynamoDB Local

- TTL 機能が制限される
- トランザクション機能が一部未サポート
- パフォーマンス特性が異なる

### LocalStack

- 完全な AWS 互換ではない
- 一部機能が Pro 版限定
- イベント配信タイミングが異なる場合あり

**推奨**: 結合テスト・本番検証は実際の AWS 環境で実施

## 参考リンク

- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Redis](https://redis.io/docs/)
- [LocalStack](https://docs.localstack.cloud/)
