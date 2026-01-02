# Terraform 設計詳細

## 1. 概要

Mini-SNSのインフラストラクチャをTerraformで管理する設計です。

**Terraformバージョン**: ≥ 1.5.0  
**AWSプロバイダー**: ≥ 5.0.0

## 2. ディレクトリ構成

```
infra/terraform/mini-sns/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/
│   ├── user-service/
│   ├── post-service/
│   ├── social-service/
│   ├── timeline-service/
│   ├── api-gateway/
│   ├── eventbridge/
│   ├── cognito/
│   └── shared/
└── scripts/
```

## 3. モジュール設計

### 3.1 リソース命名規則

`{project}-{env}-{solution}-{component}`

例:
- `mini-sns-dev-user-api` (Lambda)
- `mini-sns-prod-post-ddb` (DynamoDB)
- `mini-sns-dev-timeline-sqs-dlq` (SQS DLQ)

### 3.2 主要モジュール

#### User Service モジュール

**リソース**:
- Lambda Function: `${var.project}-${var.environment}-user-api`
- DynamoDB Table: `${var.project}-${var.environment}-user-ddb`
  - PK: `USER#{userId}`, SK: `PROFILE`
  - GSI1: `email-index`
  - GSI2: `username-index`
- IAM Role: Cognito、DynamoDB、EventBridge権限

#### Post Service モジュール

**リソース**:
- Lambda Function: `${var.project}-${var.environment}-post-api`
- DynamoDB Table: `${var.project}-${var.environment}-post-ddb`
  - PK: `POST#{postId}`, SK: `METADATA`
  - GSI1: `user-posts-index`
- IAM Role: DynamoDB、EventBridge権限

#### Timeline Service モジュール

**リソース**:
- Lambda Function (VPC): `${var.project}-${var.environment}-timeline-api`
- DynamoDB Table: `${var.project}-${var.environment}-timeline-ddb`
  - PK: `USER#{userId}`, SK: `POST#{timestamp}#{postId}`
  - TTL: 30日
- Security Group: ElastiCache接続用
- SQS Queue: `${var.project}-${var.environment}-timeline-events`
- SQS DLQ: `${var.project}-${var.environment}-timeline-dlq`

#### Social Service モジュール

**リソース**:
- Lambda Function: `${var.project}-${var.environment}-social-api`
- DynamoDB Table (Single Table): `${var.project}-${var.environment}-social-ddb`
  - PK/SK: Follow/Like両対応
  - GSI1: `reverse-index`
- SQS Queue: `${var.project}-${var.environment}-social-events`

## 4. 共通インフラモジュール

### 4.1 API Gateway

```hcl
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project}-${var.environment}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "Idempotency-Key"]
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  
  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# Rate Limiting
resource "aws_apigatewayv2_stage" "default" {
  default_route_settings {
    throttling_burst_limit = 200
    throttling_rate_limit  = 100
  }
}
```

### 4.2 EventBridge + SQS

```hcl
resource "aws_cloudwatch_event_bus" "main" {
  name = "${var.project}-${var.environment}-event-bus"
}

resource "aws_cloudwatch_event_rule" "post_created_to_timeline" {
  name           = "${var.project}-${var.environment}-post-created-to-timeline"
  event_bus_name = aws_cloudwatch_event_bus.main.name
  
  event_pattern = jsonencode({
    source      = ["mini-sns/post-service"]
    detail-type = ["com.mini-sns.post.post.created"]
  })
}

resource "aws_sqs_queue" "timeline_events" {
  name                       = "${var.project}-${var.environment}-timeline-events"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 1209600
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.timeline_dlq.arn
    maxReceiveCount     = 2
  })
}
```

### 4.3 Cognito

```hcl
resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-${var.environment}-user-pool"
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_uppercase = true
  }
  
  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_client" "main" {
  user_pool_id = aws_cognito_user_pool.main.id
  
  refresh_token_validity = 30
  access_token_validity  = 1
  id_token_validity      = 1
  
  token_validity_units {
    refresh_token = "days"
    access_token  = "hours"
    id_token      = "hours"
  }
}
```

### 4.4 ElastiCache (Redis)

```hcl
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project}-${var.environment}-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_nodes
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  automatic_failover_enabled = var.environment == "prod"
  multi_az_enabled           = var.environment == "prod"
}
```

## 5. 変数設計

### 5.1 環境別変数（dev）

```hcl
# environments/dev/terraform.tfvars
environment           = "dev"
lambda_memory         = 512
lambda_timeout        = 10
dynamodb_billing_mode = "PAY_PER_REQUEST"
pitr_enabled          = false
redis_node_type       = "cache.t3.micro"
redis_num_nodes       = 1
log_level             = "DEBUG"
```

### 5.2 環境別変数（prod）

```hcl
# environments/prod/terraform.tfvars
environment           = "prod"
lambda_memory         = 1024
lambda_timeout        = 30
dynamodb_billing_mode = "PAY_PER_REQUEST"
pitr_enabled          = true
redis_node_type       = "cache.r6g.large"
redis_num_nodes       = 2
log_level             = "INFO"
```

## 6. Outputs

```hcl
output "api_gateway_url" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "eventbridge_bus_name" {
  value = aws_cloudwatch_event_bus.main.name
}
```

## 7. Backend設定（State管理）

```hcl
terraform {
  backend "s3" {
    bucket         = "mini-sns-terraform-state"
    key            = "mini-sns/${var.environment}/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

## 8. タグ戦略

### 必須タグ

| タグ | 説明 | 例 |
|-----|------|---|
| Project | プロジェクト名 | mini-sns |
| Environment | 環境名 | dev/staging/prod |
| ManagedBy | 管理方法 | Terraform |
| Service | サービス名 | user-service |
| Component | コンポーネント | lambda/dynamodb |

## 9. CI/CD設定

### GitHub Actions Workflow

```yaml
name: Terraform Deploy

on:
  push:
    branches: [main]
    paths: ['infra/terraform/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-1
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Init
        run: terraform init
      
      - name: Terraform Plan
        run: terraform plan -out=tfplan
      
      - name: Terraform Apply (main only)
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
```

## 10. セキュリティ設定

### 10.1 暗号化

- DynamoDB: サーバー側暗号化（AWS管理キー）
- ElastiCache: 転送時・保存時暗号化
- S3 (Terraform State): KMS暗号化

### 10.2 最小権限IAM

各Lambda関数は必要最小限の権限のみ付与。

### 10.3 ネットワーク分離

- Public Subnet: API Gateway
- Private Subnet: Lambda (VPC)、ElastiCache

## 11. モニタリング

### CloudWatch Alarms

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project}-${var.environment}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  threshold           = "10"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "${var.project}-${var.environment}-dynamodb-throttle"
  comparison_operator = "GreaterThanThreshold"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  threshold           = "0"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

## 12. コスト最適化

### 環境別リソースサイジング

| リソース | dev | prod |
|---------|-----|------|
| Lambda Memory | 512MB | 1024MB |
| DynamoDB | オンデマンド | オンデマンド |
| ElastiCache | t3.micro (1) | r6g.large (2) |
| Logs保持 | 7日 | 30日 |

### 推定月額コスト（prod）

- Lambda: $20
- DynamoDB: $10
- ElastiCache: $15
- API Gateway: $5
- 合計: 約$50/月

## 13. 災害復旧

- **DynamoDB**: PITR（35日）+ 月次バックアップ
- **ElastiCache**: 日次スナップショット（prod）
- **Terraform State**: S3バージョニング有効

## 14. デプロイメント戦略

1. **dev**: PR マージ時自動デプロイ
2. **staging**: main ブランチプッシュ時自動デプロイ
3. **prod**: 手動承認 + デプロイ

## 15. 参考資料

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
