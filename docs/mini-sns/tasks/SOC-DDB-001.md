# [Implement] Social Service DynamoDBテーブル設計と実装

Task-ID: SOC-DDB-001  
Service: social-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/design/erd.md, docs/mini-sns/solutions/social-service/ddb-design.md

## Purpose

Social ServiceのDynamoDBテーブルを設計・実装し、フォロー関係といいね情報を効率的に管理する。

## Scope

### 含まれる範囲
- DynamoDBテーブル定義（Terraform）
- Single Table Design実装
- Primary Key設計（PK/SK）
- Global Secondary Index設計（reverse-index）
- 初期設定（オンデマンド、暗号化、PITR）

### 含まれない範囲（Non-Scope）
- アプリケーションコード

## Contracts

### テーブル定義
```hcl
resource "aws_dynamodb_table" "social_table" {
  name           = "mini-sns-${var.env}-social-ddb"
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
    name = "GSI1PK"
    type = "S"
  }
  
  attribute {
    name = "GSI1SK"
    type = "S"
  }
  
  global_secondary_index {
    name            = "reverse-index"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
}
```

### データモデル
- **Follow**: PK: `USER#{followerId}`, SK: `FOLLOW#{followeeId}`
- **Like**: PK: `USER#{userId}`, SK: `LIKE#{postId}`
- **GSI1**: 逆引き用（フォロワー検索、いいね一覧）

## Steps

### 1. Scaffold
- [ ] Terraformモジュールディレクトリ作成

### 2. API & Data
- [ ] DynamoDBテーブルTerraform定義作成
- [ ] GSI定義

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
And テーブル名が "mini-sns-dev-social-ddb" である
```

### AC-2: GSI作成確認
```gherkin
When テーブル詳細を確認する
Then reverse-index GSIが存在する
```

## Risks

- **R-1**: Single Table Designの複雑性
  - 対策: 詳細なドキュメント作成、アクセスパターン明確化

## DoD (Definition of Done)

- [ ] Terraformコードがリポジトリにプッシュされている
- [ ] terraform validateが成功している
- [ ] dev環境でテーブルが正常に作成されている
- [ ] コードレビュー完了
