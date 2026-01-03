# [Implement] Timeline Service DynamoDBテーブル設計と実装

Task-ID: TL-DDB-001  
Service: timeline-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/design/erd.md, docs/mini-sns/solutions/timeline-service/ddb-design.md

## Purpose

Timeline ServiceのDynamoDBテーブルを設計・実装し、ユーザーごとのタイムライン情報を効率的に管理する。

## Scope

### 含まれる範囲
- DynamoDBテーブル定義（Terraform）
- Primary Key設計（PK/SK）
- TTL設定（30日自動削除）
- 初期設定（オンデマンド、暗号化、PITR）

### 含まれない範囲（Non-Scope）
- アプリケーションコード

## Contracts

### テーブル定義
```hcl
resource "aws_dynamodb_table" "timeline_table" {
  name           = "mini-sns-${var.env}-timeline-ddb"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"
  
  attribute {
    name = "PK"
    type = "S"
  }
  
  attribute {
    name = "SK"
    type = "S"
  }
  
  ttl {
    enabled        = true
    attribute_name = "expiresAt"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Project     = "mini-sns"
    Service     = "timeline-service"
    Environment = var.env
  }
}
```

### データモデル
- **PK**: `USER#{userId}`
- **SK**: `POST#{createdAt}#{postId}` （時系列ソート用）
- **属性**: userId, postId, createdAt, expiresAt（TTL=30日後）

## Steps

### 1. Scaffold
- [ ] Terraformモジュールディレクトリ作成

### 2. API & Data
- [ ] DynamoDBテーブルTerraform定義作成
- [ ] TTL設定

### 3. Business Logic
- [ ] 該当なし

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] Terraformバリデーション
- [ ] dev環境でのテーブル作成確認

## Acceptance Criteria

### AC-1: テーブル作成成功
```gherkin
When terraform applyを実行する
Then DynamoDBテーブルが作成される
And テーブル名が "mini-sns-dev-timeline-ddb" である
```

### AC-2: TTL設定確認
```gherkin
When テーブル詳細を確認する
Then TTLが有効である
And TTL属性名が "expiresAt" である
```

### AC-3: データ自動削除確認
```gherkin
Given 30日以上前のタイムラインエントリが存在する
When DynamoDBのTTL処理が実行される
Then 古いエントリが自動削除される
```

## Risks

- **R-1**: TTL削除の遅延
  - 対策: DynamoDBのTTL仕様（48時間以内削除）を考慮

## DoD (Definition of Done)

- [ ] Terraformコードがリポジトリにプッシュされている
- [ ] terraform validateが成功している
- [ ] dev環境でテーブルが正常に作成されている
- [ ] TTL設定が有効である
- [ ] コードレビュー完了
