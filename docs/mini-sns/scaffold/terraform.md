# Terraform 運用ガイド

## 概要

Mini-SNS のインフラストラクチャを Terraform で管理する運用手順。

## ディレクトリ構成

```
infra/terraform/
├── envs/
│   ├── dev/         # 開発環境
│   ├── stg/         # ステージング環境
│   └── prod/        # 本番環境
└── modules/         # 再利用可能なモジュール（今後追加）
    ├── user-service/
    ├── post-service/
    ├── social-service/
    ├── timeline-service/
    ├── api-gateway/
    ├── eventbridge/
    └── cognito/
```

## 環境別設定

### dev（開発環境）

- **用途**: 開発・検証
- **コスト**: 最小構成
- **Lambda**: 最小メモリ
- **DynamoDB**: オンデマンド課金
- **ElastiCache**: cache.t3.micro

### stg（ステージング環境）

- **用途**: 本番前検証
- **コスト**: 中程度
- **構成**: 本番に近い設定

### prod（本番環境）

- **用途**: 本番運用
- **コスト**: パフォーマンス重視
- **Lambda**: 最適化されたメモリ
- **DynamoDB**: プロビジョニング済み容量
- **ElastiCache**: cache.r6g.large, マルチ AZ

## 基本操作

### 初期化

```bash
cd infra/terraform/envs/dev
terraform init
```

**バックエンド設定後**:

```bash
terraform init \
  -backend-config="bucket=mini-sns-terraform-state" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=ap-northeast-1" \
  -backend-config="dynamodb_table=mini-sns-terraform-locks"
```

### フォーマット

```bash
# チェック
terraform fmt -check -recursive

# 自動修正
terraform fmt -recursive
```

### 検証

```bash
terraform validate
```

### プラン

```bash
# 変更内容確認
terraform plan

# ファイルに保存
terraform plan -out=tfplan
```

### 適用

```bash
# プランを適用
terraform apply tfplan

# または直接適用
terraform apply

# 特定リソースのみ
terraform apply -target=aws_lambda_function.user_api
```

### 削除

```bash
# 全リソース削除（注意）
terraform destroy

# 特定リソースのみ
terraform destroy -target=aws_lambda_function.user_api
```

### 状態確認

```bash
# リソース一覧
terraform state list

# リソース詳細
terraform state show aws_lambda_function.user_api

# 出力値確認
terraform output
```

## 変数管理

### terraform.tfvars

```bash
# テンプレートをコピー
cp terraform.tfvars.example terraform.tfvars

# 編集（機密情報は含めない）
vim terraform.tfvars
```

**例**:

```hcl
project_name = "mini-sns"
environment  = "dev"
aws_region   = "ap-northeast-1"

tags = {
  Owner = "Development Team"
  Cost  = "Development"
}
```

### 環境変数

機密情報は環境変数で渡す：

```bash
export TF_VAR_db_password="secure-password"
terraform apply
```

### Secrets Manager（推奨）

```hcl
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "mini-sns-dev-db-password"
}

locals {
  db_password = jsondecode(data.aws_secretsmanager_secret_version.db_password.secret_string)["password"]
}
```

## State 管理

### リモート State（推奨）

**S3 バケット作成**:

```bash
aws s3 mb s3://mini-sns-terraform-state --region ap-northeast-1
aws s3api put-bucket-versioning \
  --bucket mini-sns-terraform-state \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption \
  --bucket mini-sns-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

**DynamoDB テーブル作成（ロック用）**:

```bash
aws dynamodb create-table \
  --table-name mini-sns-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

**providers.tf で設定**:

```hcl
terraform {
  backend "s3" {
    bucket         = "mini-sns-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "mini-sns-terraform-locks"
  }
}
```

### State 操作

```bash
# State のバックアップ
terraform state pull > terraform.tfstate.backup

# State のインポート
terraform import aws_lambda_function.user_api mini-sns-dev-user-api

# State からリソース削除（Terraform 管理外にする）
terraform state rm aws_lambda_function.user_api
```

## モジュール開発

### モジュール構造

```
modules/user-service/
├── main.tf        # リソース定義
├── variables.tf   # 入力変数
├── outputs.tf     # 出力値
└── README.md      # ドキュメント
```

### モジュール使用例

```hcl
module "user_service" {
  source = "../../modules/user-service"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  lambda_memory_size = 512
  dynamodb_read_capacity  = 5
  dynamodb_write_capacity = 5
}
```

## CI/CD 統合

### GitHub Actions

```yaml
- name: Terraform Format Check
  run: terraform fmt -check -recursive

- name: Terraform Init
  run: terraform init -backend=false

- name: Terraform Validate
  run: terraform validate

- name: Terraform Plan
  run: terraform plan -out=tfplan
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

# 本番適用は手動承認後
- name: Terraform Apply
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: terraform apply tfplan
```

## トラブルシューティング

### State ロックエラー

```bash
# ロック情報確認
aws dynamodb get-item \
  --table-name mini-sns-terraform-locks \
  --key '{"LockID":{"S":"mini-sns-terraform-state/dev/terraform.tfstate-md5"}}'

# 強制ロック解除（注意: 他のプロセスがないことを確認）
terraform force-unlock <LOCK_ID>
```

### State の不整合

```bash
# 実際のリソースと State を同期
terraform refresh

# または再インポート
terraform import <resource_type>.<name> <resource_id>
```

### プラン時のエラー

```bash
# 詳細ログ出力
export TF_LOG=DEBUG
terraform plan
```

## ベストプラクティス

### 1. 環境分離

- 環境ごとに独立した State
- 環境ごとに異なる AWS アカウント（推奨）

### 2. 命名規則

- `{project}-{env}-{component}`: `mini-sns-dev-user-api`
- 全リソースに `Project`, `Environment`, `ManagedBy` タグ

### 3. セキュリティ

- State は S3 暗号化 + バージョニング
- 機密情報は Secrets Manager
- IAM ロール最小権限

### 4. レビュー

- `terraform plan` 出力を必ずレビュー
- 本番適用前に stg で検証
- 削除操作は特に慎重に

## 参考リンク

- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- `docs/mini-sns/design/terraform.md` (設計詳細)
