# トレーサビリティマトリクス

## 1. 概要

要件定義→詳細設計→テストケースの対応関係を明示し、要件の網羅性を保証します。

## 2. 機能要件トレーサビリティ

### 2.1 ユーザー管理機能

| 要件ID | 要件名 | 設計コンポーネント | テストケース | 実装状況 |
|--------|--------|------------------|------------|---------|
| FR-E01 | 投稿バリデーション | Post Service API, domain-model.md | TC-P-001, TC-P-002 | 未実装 |
| FR-U03 | XSS対策 | 全サービス入力サニタイゼーション | TC-SEC-001 | 未実装 |
| FR-E02 | リアルタイム配信 | Timeline Service WebSocket | TC-T-001, TC-T-002 | 未実装 |
| FR-E03 | UI更新（フォロー） | Social Service API | TC-S-001 | 未実装 |
| FR-E04 | リトライ処理 | 全サービスエラーハンドリング | TC-ERR-001 | 未実装 |
| US-01 | ユーザー登録 | User Service /auth/register | TC-U-001～TC-U-003 | 未実装 |
| US-02 | ログイン・ログアウト | User Service /auth/login, /auth/logout | TC-U-004～TC-U-006 | 未実装 |
| US-03 | 投稿作成 | Post Service /posts | TC-P-001～TC-P-004 | 未実装 |
| US-04 | タイムライン表示 | Timeline Service /timeline | TC-T-001～TC-T-004 | 未実装 |
| US-05 | フォロー・アンフォロー | Social Service /users/{id}/follow | TC-S-001～TC-S-004 | 未実装 |
| US-06 | いいね機能 | Social Service /posts/{id}/likes | TC-S-005～TC-S-007 | 未実装 |
| US-07 | プロフィール表示 | User Service /users/{id} | TC-U-007～TC-U-009 | 未実装 |
| US-08 | 投稿削除 | Post Service DELETE /posts/{id} | TC-P-005～TC-P-007 | 未実装 |
| US-09 | レスポンシブデザイン | フロントエンド CSS | TC-UI-001～TC-UI-003 | 未実装 |
| US-10 | エラーハンドリング | errors.md（全サービス） | TC-ERR-001～TC-ERR-003 | 未実装 |

### 2.2 受け入れ基準トレーサビリティ

| AC ID | 受け入れ基準 | 設計 | テストシナリオ | 優先度 |
|-------|-------------|------|---------------|--------|
| AC-01-01 | 有効な情報での登録 | user-service/api.md POST /auth/register | integration-scenarios.md#正常系登録 | Must |
| AC-01-02 | 重複メールアドレス | user-service/errors.md ConflictError | integration-scenarios.md#異常系登録 | Must |
| AC-01-03 | 不正なパスワード | openapi.yaml バリデーション | contract-tests.md#バリデーション | Must |
| AC-01-05 | パスワードハッシュ化 | Cognito設定 | integration-scenarios.md#セキュリティ | Must |
| AC-02-01 | 有効な認証情報でログイン | user-service/sequence.md ログインフロー | integration-scenarios.md#ログイン正常 | Must |
| AC-02-02 | 誤ったパスワード | user-service/errors.md UnauthorizedError | integration-scenarios.md#ログイン異常 | Must |
| AC-02-04 | セッションタイムアウト | Cognito JWT TTL設定 | integration-scenarios.md#タイムアウト | Should |
| AC-03-01 | 有効な投稿の作成 | post-service/sequence.md 投稿作成フロー | integration-scenarios.md#投稿正常 | Must |
| AC-03-02 | 空の投稿 | post-service/api.md バリデーション | contract-tests.md#バリデーション | Must |
| AC-03-03 | 文字数超過 | post-service/domain-model.md 制約 | contract-tests.md#境界値 | Must |
| AC-03-04 | XSS対策 | 全サービス入力サニタイゼーション | integration-scenarios.md#セキュリティ | Must |
| AC-04-01 | フォローユーザーの投稿表示 | timeline-service/sequence.md タイムライン取得 | integration-scenarios.md#タイムライン正常 | Must |
| AC-04-02 | リアルタイム更新 | timeline-service/domain-model.md WebSocket配信 | integration-scenarios.md#リアルタイム | Must |
| AC-04-04 | 大量投稿の表示 | timeline-service/nonfunctional.md ページネーション | integration-scenarios.md#パフォーマンス | Should |

## 3. 非機能要件トレーサビリティ

### 3.1 パフォーマンス要件

| NFR ID | 要件 | 目標値 | 設計 | テスト | 測定方法 |
|--------|-----|--------|------|--------|---------|
| PE-01 | GET API応答時間（p95） | ≤ 200ms | nonfunctional.md | 負荷テスト | CloudWatch Metrics |
| PE-02 | POST API応答時間（p95） | ≤ 500ms | nonfunctional.md | 負荷テスト | CloudWatch Metrics |
| PE-04 | WebSocket更新遅延 | ≤ 3秒 | event-catalog.md PostCreated SLA | E2Eテスト | カスタムメトリクス |
| PE-05 | 同時接続ユーザー数 | ≥ 1,000 | system-architecture.md スケーリング | 負荷テスト | WebSocket接続数監視 |

### 3.2 セキュリティ要件

| NFR ID | 要件 | 目標値 | 設計 | テスト | 測定方法 |
|--------|-----|--------|------|--------|---------|
| SE-01 | TLSバージョン | ≥ TLS 1.2 | API Gateway設定 | 設定確認 | AWS Config |
| SE-02 | パスワードハッシュ強度 | bcrypt cost ≥ 10 | Cognito設定 | 設定確認 | Cognito設定確認 |
| SE-03 | SQLインジェクション対策 | 100% | N/A（NoSQL使用） | N/A | N/A |
| SE-06 | XSS対策率 | 100% | 入力サニタイゼーション | ペネトレーションテスト | セキュリティスキャン |
| SE-07 | CSRF対策率 | 100% | JWT認証 | セキュリティテスト | セキュリティスキャン |

### 3.3 信頼性要件

| NFR ID | 要件 | 目標値 | 設計 | テスト | 測定方法 |
|--------|-----|--------|------|--------|---------|
| RE-01 | システム稼働率 | ≥ 99.5% | マルチAZ構成 | 可用性テスト | UptimeRobot |
| RE-03 | MTBF | ≥ 720時間 | 冗長化設計 | 長期運用 | インシデント記録 |
| RE-04 | MTTR | ≤ 1時間 | runbook.md | 復旧訓練 | インシデント記録 |
| RE-05 | RPO | ≤ 5分 | DynamoDB PITR | バックアップ検証 | PITR設定確認 |
| RE-06 | RTO | ≤ 1時間 | 復旧手順 | 復旧訓練 | 手順実行時間測定 |

## 4. アーキテクチャ設計トレーサビリティ

### 4.1 マイクロサービス分割

| サービス | 責務 | Bounded Context | 設計ドキュメント | 関連要件 |
|---------|-----|----------------|----------------|---------|
| User Service | ユーザー管理・認証 | ユーザー管理コンテキスト | solutions/user-service/ | US-01, US-02, US-07 |
| Post Service | 投稿管理 | 投稿コンテキスト | solutions/post-service/ | US-03, US-08 |
| Social Service | ソーシャルグラフ | ソーシャルインタラクションコンテキスト | solutions/social-service/ | US-05, US-06 |
| Timeline Service | タイムライン生成・配信 | タイムラインコンテキスト | solutions/timeline-service/ | US-04, FR-E02 |

### 4.2 データストア設計

| テーブル名 | エンティティ | 設計ドキュメント | 関連要件 |
|-----------|------------|----------------|---------|
| mini-sns-{env}-user-ddb | User | erd.md#User, user-service/ddb-design.md | US-01, US-02 |
| mini-sns-{env}-post-ddb | Post | erd.md#Post, post-service/ddb-design.md | US-03, US-08 |
| mini-sns-{env}-social-ddb | Follow, Like | erd.md#Social, social-service/ddb-design.md | US-05, US-06 |
| mini-sns-{env}-timeline-ddb | TimelineEntry | erd.md#Timeline, timeline-service/ddb-design.md | US-04 |

## 5. イベント駆動設計トレーサビリティ

| イベントタイプ | 発行者 | 購読者 | 設計 | 関連要件 |
|--------------|-------|--------|------|---------|
| UserRegistered | User Service | (将来) | event-catalog.md#UserRegistered | US-01 |
| PostCreated | Post Service | Timeline Service | event-catalog.md#PostCreated | US-03, FR-E02 |
| PostDeleted | Post Service | Timeline Service, Social Service | event-catalog.md#PostDeleted | US-08 |
| FollowCreated | Social Service | Timeline Service | event-catalog.md#FollowCreated | US-05 |
| FollowDeleted | Social Service | Timeline Service | event-catalog.md#FollowDeleted | US-05 |
| LikeCreated | Social Service | (将来) | event-catalog.md#LikeCreated | US-06 |

## 6. API設計トレーサビリティ

| エンドポイント | HTTPメソッド | サービス | 設計 | 関連要件 |
|--------------|------------|---------|------|---------|
| /auth/register | POST | User Service | openapi.yaml, user-service/api.md | US-01 |
| /auth/login | POST | User Service | openapi.yaml, user-service/api.md | US-02 |
| /auth/logout | POST | User Service | openapi.yaml, user-service/api.md | US-02 |
| /users/{id} | GET | User Service | openapi.yaml, user-service/api.md | US-07 |
| /users/{id}/posts | GET | User Service | openapi.yaml, user-service/api.md | US-07 |
| /posts | POST | Post Service | openapi.yaml, post-service/api.md | US-03 |
| /posts/{id} | GET | Post Service | openapi.yaml, post-service/api.md | US-04 |
| /posts/{id} | DELETE | Post Service | openapi.yaml, post-service/api.md | US-08 |
| /timeline | GET | Timeline Service | openapi.yaml, timeline-service/api.md | US-04 |
| /users/{id}/follow | POST | Social Service | openapi.yaml, social-service/api.md | US-05 |
| /users/{id}/follow | DELETE | Social Service | openapi.yaml, social-service/api.md | US-05 |
| /posts/{id}/likes | POST | Social Service | openapi.yaml, social-service/api.md | US-06 |
| /posts/{id}/likes | DELETE | Social Service | openapi.yaml, social-service/api.md | US-06 |

## 7. テスト戦略トレーサビリティ

### 7.1 テストレベル

| テストレベル | 対象 | ツール | カバレッジ目標 | 関連ドキュメント |
|------------|------|--------|--------------|----------------|
| 単体テスト | Lambda関数、ドメインロジック | Jest/Pytest | ≥ 80% | 各service/tests/ |
| 契約テスト | サービス間API | Pact | 100%（全API） | */tests/contract-tests.md |
| 統合テスト | サービス内結合 | Jest/Pytest + LocalStack | ≥ 70% | */tests/integration-scenarios.md |
| E2Eテスト | システム全体 | Playwright/Cypress | 主要シナリオ | sequence-main.md |
| 負荷テスト | パフォーマンス | k6/Artillery | PE要件全て | nonfunctional.md |
| セキュリティテスト | 脆弱性 | OWASP ZAP | SE要件全て | nonfunctional.md |

### 7.2 テストカバレッジマップ

| 機能 | 単体 | 契約 | 統合 | E2E | 負荷 | セキュリティ |
|-----|-----|-----|-----|-----|-----|------------|
| ユーザー登録 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ログイン | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 投稿作成 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| タイムライン取得 | ✓ | ✓ | ✓ | ✓ | ✓ | − |
| フォロー | ✓ | ✓ | ✓ | ✓ | − | − |
| いいね | ✓ | ✓ | ✓ | − | − | − |
| 投稿削除 | ✓ | ✓ | ✓ | − | − | − |
| リアルタイム配信 | ✓ | − | ✓ | ✓ | ✓ | − |

## 8. リスク対策トレーサビリティ

| リスクID | リスク内容 | 影響度 | 対策設計 | 検証方法 |
|---------|-----------|--------|---------|---------|
| R-01 | サーバー過負荷 | 高 | スケーリング設定、接続数制限 | 負荷テスト |
| R-02 | スパム投稿 | 中 | レート制限（10投稿/分） | レート制限テスト |
| R-03 | DB スケーラビリティ | 中 | DynamoDB オンデマンド、インデックス最適化 | 容量計画レビュー |
| R-04 | セキュリティ脆弱性 | 高 | 入力サニタイゼーション、認証・認可 | セキュリティスキャン |
| R-05 | ブラウザ互換性 | 低 | レスポンシブデザイン、Polyfill | クロスブラウザテスト |

## 9. 変更管理

### 9.1 要件変更履歴

| 日付 | 変更要件 | 影響範囲（設計） | 影響範囲（テスト） | 承認者 |
|------|---------|-----------------|------------------|--------|
| 2026-01-02 | 初版作成 | 全ドキュメント | 全テストケース | N/A |

### 9.2 設計変更履歴

| 日付 | 変更内容 | 影響要件 | 影響テスト | 承認者 |
|------|---------|---------|-----------|--------|
| 2026-01-02 | 初版作成 | N/A | N/A | N/A |

## 10. 完了条件（Definition of Done）

### 10.1 設計フェーズ

- [ ] 全要件がアーキテクチャ・設計コンポーネントにマッピングされている
- [ ] すべての設計ドキュメントがレビュー済み
- [ ] API仕様（OpenAPI）が承認済み
- [ ] イベントスキーマが定義済み
- [ ] NFR数値が全て定義済み

### 10.2 実装フェーズ

- [ ] 単体テストカバレッジ ≥ 80%
- [ ] 契約テスト（全API）実装済み
- [ ] 統合テスト（主要シナリオ）実装済み
- [ ] E2Eテスト（主要フロー）実装済み
- [ ] すべてのテストがパス

### 10.3 リリース条件

- [ ] 負荷テスト完了（PE要件達成）
- [ ] セキュリティスキャン完了（脆弱性ゼロ）
- [ ] Runbook作成・レビュー済み
- [ ] 本番環境デプロイ手順確認済み
- [ ] ロールバック手順確認済み

## 11. 参考資料

- [要件定義書](../requirements.md)
- [ISO/IEC/IEEE 29148:2018 Systems and software engineering — Life cycle processes — Requirements engineering](https://www.iso.org/standard/72089.html)
