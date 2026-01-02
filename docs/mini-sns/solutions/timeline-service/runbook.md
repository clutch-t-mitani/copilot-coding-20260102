# 運用手順（Runbook）

## 1. 障害対応

### 1.1 アラート: Lambda Errors > 10

**診断**:
1. CloudWatch Logs確認
2. X-Ray トレース確認
3. エラーログ分析

**是正**:
1. エラー原因特定
2. 緊急修正またはロールバック
3. ヘルスチェック確認

### 1.2 アラート: DynamoDB Throttling

**診断**:
1. CloudWatch Metrics確認（ConsumedReadCapacityUnits/WriteCapacityUnits）
2. ホットキー確認

**是正**:
1. DynamoDBキャパシティ増強（オンデマンドまたはプロビジョニング増加）
2. アクセスパターン最適化

## 2. ロールバック手順

1. Terraform state確認
2. 前バージョンにロールバック: `terraform apply -target=module.$SERVICE`
3. ヘルスチェック確認

## 3. DLQリカバリー

詳細は../../design/event-catalog.md#エラーハンドリングを参照。
