# [Implement] User Service DynamoDBテーブル設計と実装

Task-ID: USR-DDB-001  
Service: user-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/design/erd.md, docs/mini-sns/solutions/user-service/ddb-design.md

## Purpose

User ServiceのDynamoDBテーブルを設計・実装し、ユーザープロフィール情報を効率的に保存・取得できるデータストアを構築する。

## Scope

### 含まれる範囲
- DynamoDBテーブル定義（Terraform）
- Primary Key設計（PK/SK）
- Global Secondary Index設計（email-index, username-index）
- テーブル作成スクリプト
- 初期設定（オンデマンドキャパシティモード、暗号化、PITR）

### 含まれない範囲（Non-Scope）
- データマイグレーション（新規プロジェクトのため不要）
- バックアップ運用手順（runbook.mdで定義）
- アプリケーションコード（各機能タスクで実装）

## Contracts

### テーブル定義
```hcl
resource "aws_dynamodb_table" "user_table" {
  name           = "mini-sns-${var.env}-user-ddb"
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
    name = "email"
    type = "S"
  }
  
  attribute {
    name = "username"
    type = "S"
  }
  
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "username-index"
    hash_key        = "username"
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
    Service     = "user-service"
    Environment = var.env
  }
}
```

### データモデル
- **PK**: `USER#{userId}` (例: `USER#123e4567-e89b-12d3-a456-426614174000`)
- **SK**: `PROFILE`
- **属性**: userId, email, username, created_at, updated_at

## Steps

### 1. Scaffold
- [ ] Terraformモジュールディレクトリ作成（infra/terraform/modules/user-service/）
- [ ] variables.tf、outputs.tf、main.tfファイル作成

### 2. API & Data
- [ ] DynamoDBテーブルTerraform定義作成
- [ ] GSI定義（email-index, username-index）
- [ ] PITR、暗号化設定
- [ ] タグ設定

### 3. Business Logic
- [ ] 該当なし（インフラストラクチャタスク）

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] Terraformバリデーション（terraform validate）
- [ ] Terraformプラン確認（terraform plan）
- [ ] 手動テスト: dev環境でのテーブル作成確認
- [ ] 手動テスト: GSIクエリ動作確認

## Acceptance Criteria

### AC-1: テーブル作成成功
```gherkin
Given Terraformコードが定義されている
When terraform applyを実行する
Then DynamoDBテーブルが作成される
And テーブル名が "mini-sns-dev-user-ddb" である
And billing_modeが "PAY_PER_REQUEST" である
```

### AC-2: GSI作成確認
```gherkin
Given DynamoDBテーブルが作成されている
When テーブル詳細を確認する
Then email-index GSIが存在する
And username-index GSIが存在する
And 両方のGSIがACTIVE状態である
```

### AC-3: セキュリティ設定確認
```gherkin
Given DynamoDBテーブルが作成されている
When テーブルのセキュリティ設定を確認する
Then サーバーサイド暗号化が有効である
And PITRが有効である
```

### AC-4: GSIクエリ動作確認
```gherkin
Given テストデータが挿入されている
When email-indexでクエリを実行する
Then 正しいユーザーレコードが返される
And クエリ応答時間が100ミリ秒以内である
```

## Risks

- **R-1**: GSI作成の遅延（大規模データ時）
  - 対策: 新規テーブルのため影響なし、将来的な増設時は注意
- **R-2**: コスト増加（オンデマンドモード）
  - 対策: トラフィック安定後にプロビジョニングモードへ移行検討

## DoD (Definition of Done)

- [ ] Terraformコードがリポジトリにプッシュされている
- [ ] terraform validateが成功している
- [ ] dev環境でテーブルが正常に作成されている
- [ ] GSIが全てACTIVE状態である
- [ ] ドキュメント（ddb-design.md）が更新されている
- [ ] コードレビューが完了し、承認されている
