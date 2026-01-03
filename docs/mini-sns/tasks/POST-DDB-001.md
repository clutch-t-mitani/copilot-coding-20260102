# [Implement] Post Service DynamoDBテーブル設計と実装

Task-ID: POST-DDB-001  
Service: post-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/design/erd.md, docs/mini-sns/solutions/post-service/ddb-design.md

## Purpose

Post ServiceのDynamoDBテーブルを設計・実装し、投稿情報を効率的に保存・取得できるデータストアを構築する。

## Scope

### 含まれる範囲
- DynamoDBテーブル定義（Terraform）
- Primary Key設計（PK/SK）
- Global Secondary Index設計（user-posts-index）
- テーブル作成スクリプト
- 初期設定（オンデマンドキャパシティモード、暗号化、PITR）

### 含まれない範囲（Non-Scope）
- アプリケーションコード（各機能タスクで実装）

## Contracts

### テーブル定義
```hcl
resource "aws_dynamodb_table" "post_table" {
  name           = "mini-sns-${var.env}-post-ddb"
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
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "createdAt"
    type = "S"
  }
  
  global_secondary_index {
    name            = "user-posts-index"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Project     = "mini-sns"
    Service     = "post-service"
    Environment = var.env
  }
}
```

### データモデル
- **PK**: `POST#{postId}`
- **SK**: `METADATA`
- **属性**: postId, userId, content, likesCount, createdAt, updatedAt

## Steps

### 1. Scaffold
- [ ] Terraformモジュールディレクトリ作成

### 2. API & Data
- [ ] DynamoDBテーブルTerraform定義作成
- [ ] GSI定義（user-posts-index）

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
Given Terraformコードが定義されている
When terraform applyを実行する
Then DynamoDBテーブルが作成される
And テーブル名が "mini-sns-dev-post-ddb" である
```

### AC-2: GSI作成確認
```gherkin
Given DynamoDBテーブルが作成されている
When テーブル詳細を確認する
Then user-posts-index GSIが存在する
And GSIがACTIVE状態である
```

## Risks

- **R-1**: コスト増加
  - 対策: トラフィック安定後にプロビジョニングモードへ移行検討

## DoD (Definition of Done)

- [ ] Terraformコードがリポジトリにプッシュされている
- [ ] terraform validateが成功している
- [ ] dev環境でテーブルが正常に作成されている
- [ ] コードレビュー完了
