# Mini-SNS 詳細設計 - 全体目次

## 1. ドキュメント概要

本ディレクトリには、Mini-SNSプロジェクトの詳細設計ドキュメントが格納されています。
マイクロサービスアーキテクチャを採用し、各サービスは独立してデプロイ可能な設計としています。

**プロジェクト識別子**: `mini-sns`  
**アーキテクチャパターン**: マイクロサービス（Lambda + DynamoDB + EventBridge）  
**クラウドプロバイダー**: AWS  
**バージョン**: 1.0.0  
**最終更新日**: 2026-01-02

## 2. 共通設計ドキュメント

### 2.1 アーキテクチャ
- [system-architecture.md](./system-architecture.md) - システム全体のアーキテクチャ説明（文章形式）
- [diagrams/system-architecture.mmd](./diagrams/system-architecture.mmd) - C4 Containerダイアグラム（Mermaid）

### 2.2 API仕様
- [openapi.yaml](./openapi.yaml) - 公開REST API仕様（OpenAPI 3.0）
- [service-interfaces.md](./service-interfaces.md) - マイクロサービス間インタフェース仕様
- [event-catalog.md](./event-catalog.md) - サービス間イベント定義（CloudEvents準拠）

### 2.3 データ設計
- [erd.md](./erd.md) - エンティティ関連図とDynamoDB設計（PK/SK/GSI）

### 2.4 フロー設計
- [sequence-main.md](./sequence-main.md) - 主要ユースケースのシーケンス図（晴天・雨天）

### 2.5 非機能要件・品質
- [nonfunctional.md](./nonfunctional.md) - 非機能要件（ISO/IEC 25010準拠、数値化）
- [traceability.md](./traceability.md) - 要件→設計→テスト対応表

### 2.6 インフラストラクチャ
- [terraform.md](./terraform.md) - Terraform設計詳細（モジュール構成、変数、タグ戦略）

## 3. ソリューション別設計ドキュメント

Mini-SNSは以下の4つのマイクロサービスで構成されます：

### 3.1 User Service（ユーザー管理サービス）
**責務**: ユーザー登録、認証、プロフィール管理

ドキュメント: [solutions/user-service/](../solutions/user-service/)
- README.md - サービス概要・境界
- api.md - REST API定義
- service-contracts.md - 他サービスとの契約
- domain-model.md - ドメインモデル
- ddb-design.md - DynamoDB設計
- sequence.md - シーケンス図
- errors.md - エラー仕様
- nonfunctional.md - SLO/SLA
- idempotency.md - 冪等性設計
- runbook.md - 運用手順
- tests/ - テスト設計

### 3.2 Post Service（投稿管理サービス）
**責務**: 投稿作成、削除、取得

ドキュメント: [solutions/post-service/](../solutions/post-service/)
- README.md - サービス概要・境界
- api.md - REST API定義
- service-contracts.md - 他サービスとの契約
- domain-model.md - ドメインモデル
- ddb-design.md - DynamoDB設計
- sequence.md - シーケンス図
- errors.md - エラー仕様
- nonfunctional.md - SLO/SLA
- idempotency.md - 冪等性設計
- runbook.md - 運用手順
- tests/ - テスト設計

### 3.3 Social Service（ソーシャルグラフサービス）
**責務**: フォロー/アンフォロー、いいね管理

ドキュメント: [solutions/social-service/](../solutions/social-service/)
- README.md - サービス概要・境界
- api.md - REST API定義
- service-contracts.md - 他サービスとの契約
- domain-model.md - ドメインモデル
- ddb-design.md - DynamoDB設計
- sequence.md - シーケンス図
- errors.md - エラー仕様
- nonfunctional.md - SLO/SLA
- idempotency.md - 冪等性設計
- runbook.md - 運用手順
- tests/ - テスト設計

### 3.4 Timeline Service（タイムラインサービス）
**責務**: タイムライン生成、リアルタイム配信

ドキュメント: [solutions/timeline-service/](../solutions/timeline-service/)
- README.md - サービス概要・境界
- api.md - REST API定義
- service-contracts.md - 他サービスとの契約
- domain-model.md - ドメインモデル
- ddb-design.md - DynamoDB設計
- sequence.md - シーケンス図
- errors.md - エラー仕様
- nonfunctional.md - SLO/SLA
- idempotency.md - 冪等性設計
- runbook.md - 運用手順
- tests/ - テスト設計

## 4. 設計原則

### 4.1 独立性の担保
- 各マイクロサービスは独立してデプロイ可能
- データベースは各サービスで独立（Database per Service）
- サービス間の通信は公開APIまたはイベント経由のみ
- 共有モデル・共有ライブラリは使用しない

### 4.2 命名規則
**リソース名**: `{project_identifier}-{env}-{solution}-{component}`

例:
- `mini-sns-dev-user-api` - User ServiceのAPI Lambda
- `mini-sns-prod-post-ddb` - Post ServiceのDynamoDBテーブル
- `mini-sns-dev-timeline-sqs-dlq` - Timeline ServiceのDLQ

### 4.3 契約ファースト開発
- インタフェース定義を先行して作成
- Consumer Driven Contractによる契約テスト
- セマンティックバージョニングによるバージョン管理
- 後方互換性を最低6ヶ月維持

### 4.4 観測性
- 分散トレーシング（AWS X-Ray）
- 構造化ログ（JSON形式）
- メトリクス収集（CloudWatch Metrics）
- アラート設定（CloudWatch Alarms）

## 5. 技術スタック

### 5.1 フロントエンド
- React 18+
- TypeScript 5+
- WebSocket（リアルタイム通信）

### 5.2 バックエンド
- AWS Lambda（Node.js 18+ または Python 3.11+）
- API Gateway（REST API）
- API Gateway WebSocket API（リアルタイム通信）

### 5.3 データストア
- DynamoDB（NoSQL）
- ElastiCache Redis（キャッシュ・セッション）

### 5.4 メッセージング
- EventBridge（イベント駆動）
- SQS（非同期処理・DLQ）

### 5.5 認証
- Amazon Cognito（ユーザープール）
- JWT（トークンベース認証）

### 5.6 監視
- CloudWatch Logs / Metrics / Alarms
- AWS X-Ray（分散トレーシング）

### 5.7 IaC
- Terraform 1.5+
- AWS CDK（オプション）

## 6. ドキュメント読み方ガイド

### 6.1 新規参画者向け
1. [system-architecture.md](./system-architecture.md) - システム全体像を把握
2. [diagrams/system-architecture.mmd](./diagrams/system-architecture.mmd) - アーキテクチャ図で視覚的に理解
3. 各ソリューションのREADME.md - 各サービスの責務を理解
4. [openapi.yaml](./openapi.yaml) - 公開APIを確認

### 6.2 開発者向け
1. 担当するソリューションのREADME.md
2. api.md - 実装すべきエンドポイント
3. domain-model.md - ドメインロジック
4. ddb-design.md - データストア設計
5. service-contracts.md - 他サービスとの連携方法

### 6.3 運用担当者向け
1. [nonfunctional.md](./nonfunctional.md) - SLA・監視指標
2. 各ソリューションのrunbook.md - 障害対応手順
3. [terraform.md](./terraform.md) - インフラ構成

## 7. 更新履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| 2026-01-02 | 1.0.0 | 初版作成 | GitHub Copilot |

## 8. 関連ドキュメント

- [要件定義書](../requirements.md)
- Infrastructure as Code: `infra/terraform/mini-sns/`（別途作成予定）

## 9. 問い合わせ先

設計に関する質問・フィードバックはGitHub Issuesで管理してください。
