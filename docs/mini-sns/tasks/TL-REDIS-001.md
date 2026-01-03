# [Implement] Timeline Service Redisキャッシュ設計と実装

Task-ID: TL-REDIS-001  
Service: timeline-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/solutions/timeline-service/**/*.md

## Purpose

Timeline Serviceで使用するElastiCache Redisクラスターを設計・実装し、タイムラインキャッシュとWebSocket接続管理を提供する。

## Scope

### 含まれる範囲
- ElastiCache Redisクラスター定義（Terraform）
- VPC設定（プライベートサブネット配置）
- セキュリティグループ設定
- パラメータグループ設定
- マルチAZ設定（本番環境）

### 含まれない範囲（Non-Scope）
- アプリケーションコード

## Contracts

### Redis設定
```hcl
resource "aws_elasticache_cluster" "timeline_redis" {
  cluster_id           = "mini-sns-${var.env}-timeline-redis"
  engine               = "redis"
  node_type            = var.env == "prod" ? "cache.r6g.large" : "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = aws_elasticache_parameter_group.timeline.name
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.timeline.name
  security_group_ids   = [aws_security_group.timeline_redis.id]
  
  tags = {
    Project     = "mini-sns"
    Service     = "timeline-service"
    Environment = var.env
  }
}

resource "aws_elasticache_parameter_group" "timeline" {
  name   = "mini-sns-${var.env}-timeline-params"
  family = "redis7"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
}
```

### 使用用途
1. **タイムラインキャッシュ**
   - キー: `timeline:{userId}:{offset}:{limit}`
   - TTL: 60秒
   - 値: JSON（投稿リスト）

2. **WebSocket接続管理**
   - キー: `ws:connection:{connectionId}`
   - TTL: 10分
   - 値: JSON（userId、connectedAt）

3. **冪等性キー**
   - キー: `idempotency:{key}`
   - TTL: 24時間
   - 値: レスポンスデータ

## Steps

### 1. Scaffold
- [ ] Terraformモジュールディレクトリ作成

### 2. API & Data
- [ ] ElastiCacheクラスターTerraform定義
- [ ] VPCサブネットグループ定義
- [ ] セキュリティグループ定義
- [ ] パラメータグループ定義

### 3. Business Logic
- [ ] 該当なし

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] Terraformバリデーション
- [ ] dev環境でのRedis作成確認
- [ ] Lambda→Redis接続確認

## Acceptance Criteria

### AC-1: Redisクラスター作成成功
```gherkin
When terraform applyを実行する
Then ElastiCache Redisクラスターが作成される
And クラスターIDが "mini-sns-dev-timeline-redis" である
```

### AC-2: セキュリティ設定確認
```gherkin
When Redisクラスターの設定を確認する
Then プライベートサブネットに配置されている
And Lambda関数からのみアクセス可能である
And パブリックインターネットからアクセスできない
```

### AC-3: パラメータ設定確認
```gherkin
When パラメータグループを確認する
Then maxmemory-policyが "allkeys-lru" である
```

### AC-4: Lambda接続確認
```gherkin
Given Redisクラスターが起動している
When Lambda関数からRedisに接続する
Then 接続が成功する
And SET/GETコマンドが正常に動作する
```

## Risks

- **R-1**: Redis障害時のサービス影響
  - 対策: フォールバック処理（DynamoDBダイレクト取得）
- **R-2**: コスト増加（本番環境）
  - 対策: dev環境はt3.micro、本番環境のみr6g.large

## DoD (Definition of Done)

- [ ] Terraformコードがリポジトリにプッシュされている
- [ ] terraform validateが成功している
- [ ] dev環境でRedisクラスターが正常に作成されている
- [ ] Lambda→Redis接続が確認されている
- [ ] セキュリティグループが適切に設定されている
- [ ] コードレビュー完了
