# Mini-SNS システムアーキテクチャ

## 1. アーキテクチャ概要

Mini-SNSは、マイクロサービスアーキテクチャを採用したサーバーレスSNSプラットフォームです。
4つの独立したマイクロサービスで構成され、それぞれが明確な責務を持ち、独立してデプロイ・スケールできる設計となっています。

### 1.1 アーキテクチャスタイル
- **マイクロサービスアーキテクチャ**: サービス境界はBounded Contextに基づき定義
- **サーバーレス**: AWS Lambda + DynamoDB + API Gatewayを活用
- **イベント駆動**: EventBridgeによる疎結合な非同期処理
- **Database per Service**: 各サービスが独立したDynamoDBテーブルを保有

### 1.2 設計方針
1. **独立性**: 各サービスは独立してデプロイ・スケール可能
2. **疎結合**: サービス間通信はREST APIまたはイベント経由のみ
3. **高可用性**: マルチAZ配置、自動スケーリング
4. **セキュリティ**: 最小権限の原則、暗号化（転送時・保存時）
5. **観測性**: 分散トレーシング、構造化ログ、メトリクス

## 2. システムコンポーネント

### 2.1 マイクロサービス一覧

#### User Service（ユーザー管理サービス）
- **責務**: ユーザー登録、認証（Cognito連携）、プロフィール管理
- **公開API**: `/auth/*`, `/users/*`
- **データストア**: `mini-sns-{env}-user-ddb`
- **発行イベント**: `UserRegistered`, `UserProfileUpdated`
- **購読イベント**: なし

#### Post Service（投稿管理サービス）
- **責務**: 投稿の作成、削除、取得
- **公開API**: `/posts/*`
- **データストア**: `mini-sns-{env}-post-ddb`
- **発行イベント**: `PostCreated`, `PostDeleted`
- **購読イベント**: なし

#### Social Service（ソーシャルグラフサービス）
- **責務**: フォロー/アンフォロー関係管理、いいね管理
- **公開API**: `/users/{userId}/follow`, `/posts/{postId}/likes`
- **データストア**: `mini-sns-{env}-social-ddb`
- **発行イベント**: `FollowCreated`, `FollowDeleted`, `LikeCreated`, `LikeDeleted`
- **購読イベント**: `PostDeleted`（いいね削除のため）

#### Timeline Service（タイムラインサービス）
- **責務**: タイムライン生成、リアルタイム配信（WebSocket）
- **公開API**: `/timeline`, WebSocket `/ws`
- **データストア**: `mini-sns-{env}-timeline-ddb`, ElastiCache Redis
- **発行イベント**: なし
- **購読イベント**: `PostCreated`, `FollowCreated`, `FollowDeleted`

### 2.2 共有インフラストラクチャ

#### API Gateway
- **REST API**: 同期的なHTTPリクエスト処理（各サービスのLambdaへルーティング）
- **WebSocket API**: リアルタイムタイムライン更新配信
- **認証**: Amazon Cognitoオーソライザー（JWTトークン検証）
- **レート制限**: 1ユーザーあたり100 req/秒（バーストバケット200）

#### Amazon Cognito
- **ユーザープール**: 認証情報管理（メールアドレス、パスワード）
- **JWT発行**: アクセストークン（TTL: 1時間）、リフレッシュトークン（TTL: 30日）
- **パスワードポリシー**: 最小8文字、英数字記号混在

#### EventBridge
- **イベントバス**: `mini-sns-{env}-event-bus`
- **イベントルーティング**: CloudEventsスキーマ準拠
- **デッドレターキュー**: 処理失敗イベントはSQS DLQへ送信

#### ElastiCache Redis
- **用途**: タイムラインキャッシュ、WebSocket接続管理
- **ノードタイプ**: cache.t3.micro（開発）、cache.r6g.large（本番）
- **レプリケーション**: マルチAZ（本番環境）

#### CloudWatch
- **ログ集約**: 全Lambda関数のログを `/aws/lambda/{function-name}` に集約
- **メトリクス**: カスタムメトリクス（タイムライン更新遅延、WebSocket接続数）
- **アラーム**: エラー率、レイテンシ、スロットリング

#### X-Ray
- **分散トレーシング**: サービス間リクエストのトレース
- **サンプリングレート**: 5%（通常時）、100%（エラー時）

## 3. データフロー

### 3.1 同期フロー（REST API）

#### ユーザー登録フロー
```
Client → API Gateway → User Service Lambda → Cognito → DynamoDB
    ← JWT Token ←              ←               ←        ←
```
1. クライアントがメール・パスワードをPOST `/auth/register`
2. API Gatewayが認証なしで受付（公開エンドポイント）
3. User Service LambdaがCognitoにユーザー作成
4. Cognitoが成功時、User ServiceがDynamoDBにプロフィール保存
5. `UserRegistered`イベントをEventBridgeに発行
6. JWTトークンをクライアントに返却

#### タイムライン取得フロー
```
Client → API Gateway (認証) → Timeline Service Lambda → Redis (キャッシュヒット)
                                                     → DynamoDB (キャッシュミス)
                                                     → Post Service API (投稿詳細取得)
                                                     → User Service API (著者情報取得)
```
1. クライアントがGET `/timeline?limit=20` (JWTトークン付き)
2. API GatewayがCognitoオーソライザーでトークン検証
3. Timeline Service LambdaがRedisキャッシュ確認
4. キャッシュミス時、DynamoDBからタイムラインエントリ取得
5. Post ServiceとUser ServiceのAPIを並列呼び出し（詳細情報取得）
6. 結果をRedisにキャッシュ（TTL: 60秒）
7. クライアントに返却

### 3.2 非同期フロー（イベント駆動）

#### 投稿作成時のタイムライン配信
```
Client → Post Service → EventBridge (PostCreated) → Timeline Service → WebSocket配信
                                                  ↓
                                              SQS Queue (リトライ用)
```
1. クライアントがPOST `/posts` で投稿作成
2. Post ServiceがDynamoDBに投稿保存
3. `PostCreated`イベントをEventBridgeに発行（3秒以内）
4. Timeline ServiceがイベントをSQS経由で受信
5. フォロワーのタイムラインをDynamoDB/Redisに書き込み
6. WebSocket APIを通じてリアルタイム配信（3秒以内）
7. 失敗時はDLQに送信（最大再試行回数: 2回）

#### フォロー時のタイムライン再構築
```
Client → Social Service → EventBridge (FollowCreated) → Timeline Service
                                                       ↓
                                                  SQS Queue
                                                       ↓
                                                  Lambda (非同期処理)
                                                       ↓
                                                  Post Service API (最新投稿取得)
```
1. クライアントがPOST `/users/{userId}/follow`
2. Social ServiceがDynamoDBにフォロー関係保存
3. `FollowCreated`イベントをEventBridgeに発行
4. Timeline ServiceがSQS経由で受信
5. Post Service APIを呼び出し、フォロー対象の最新20件取得
6. タイムラインDynamoDBに追加、Redisキャッシュ更新

## 4. 通信パターン

### 4.1 同期通信（REST API）
- **プロトコル**: HTTPS (TLS 1.2以上)
- **形式**: JSON (Content-Type: application/json)
- **認証**: Bearer Token (JWT)
- **タイムアウト**: 3秒（API Gateway → Lambda）、10秒（Lambda → 他サービスAPI）
- **リトライ**: 指数バックオフ（初回1秒、最大3回）
- **回路ブレーカー**: 連続失敗5回で30秒間オープン

### 4.2 非同期通信（イベント）
- **プロトコル**: EventBridge + SQS
- **形式**: CloudEvents 1.0スキーマ準拠
- **配信保証**: At-least-once（重複可能性あり）
- **順序保証**: なし（必要な場合はSQS FIFOを使用）
- **可視性タイムアウト**: 30秒
- **メッセージ保持期間**: 14日
- **DLQ**: 最大受信回数2回で移動

### 4.3 リアルタイム通信（WebSocket）
- **プロトコル**: WSS (WebSocket over TLS)
- **認証**: 接続時にJWTトークン検証
- **接続維持**: Ping/Pong（30秒間隔）
- **切断**: アイドルタイムアウト 10分
- **再接続**: 指数バックオフ（クライアント側実装）

## 5. セキュリティ

### 5.1 認証・認可
- **認証**: Amazon Cognito（JWT）
- **認可**: Lambda関数内でトークンのClaimsを検証
- **スコープ**: 現バージョンではスコープなし（将来拡張予定）

### 5.2 暗号化
- **転送時**: TLS 1.2以上（API Gateway、WebSocket API）
- **保存時**: DynamoDB暗号化（AWS管理キー）、S3暗号化（将来の画像対応時）
- **パスワード**: Cognitoがbcrypt相当のハッシュ化を実施

### 5.3 ネットワーク分離
- **VPC**: Lambda関数は必要に応じてVPC内に配置（ElastiCache接続時）
- **セキュリティグループ**: 最小権限（Redisへのアクセスのみ許可）
- **プライベートサブネット**: データストアはインターネット非公開

### 5.4 入力検証
- **API Gateway**: リクエストバリデーション（OpenAPIスキーマ）
- **Lambda**: 入力サニタイゼーション（XSS対策）
- **DynamoDB**: プリペアドステートメント相当（SDKの型安全性）

### 5.5 レート制限
- **API Gateway**: 100 req/秒/ユーザー、バースト200
- **投稿制限**: 1分間に10投稿/ユーザー（Lambda内ロジック）
- **WebSocket**: 100メッセージ/秒/接続

## 6. スケーラビリティ

### 6.1 水平スケーリング
- **Lambda**: 自動スケーリング（最大同時実行数: 1000）
- **DynamoDB**: オンデマンドキャパシティモード（自動スケール）
- **ElastiCache**: クラスターモード有効化（本番環境）

### 6.2 容量計画
- **想定ユーザー数**: 1,000アクティブユーザー（ピーク時）
- **投稿数**: 5件/日/ユーザー = 5,000件/日
- **DynamoDB書き込み**: 約6 WCU（平均）、ピーク時20 WCU
- **DynamoDB読み込み**: 約100 RCU（タイムライン取得が主）
- **Redis**: 1GB（タイムラインキャッシュ100ユーザー分）

### 6.3 パフォーマンス目標
- **API応答時間**: p95 ≤ 250ms（同期API）
- **タイムライン更新遅延**: ≤ 3秒（イベント発行→WebSocket配信）
- **WebSocket接続数**: 最大1,000同時接続
- **スループット**: 1,000 req/秒（全サービス合計）

## 7. 可用性・信頼性

### 7.1 可用性設計
- **SLA**: 99.9%（月間ダウンタイム < 43分）
- **マルチAZ**: DynamoDB、ElastiCache、Lambda（自動）
- **ヘルスチェック**: API Gateway `/health` エンドポイント
- **フェイルオーバー**: 自動（AWSサービスレベル）

### 7.2 データ永続性
- **バックアップ**: DynamoDB PITR（Point-in-Time Recovery）有効化
- **保持期間**: 35日
- **RPO**: 5分（PITR）
- **RTO**: 1時間（復旧手順実行時間）

### 7.3 エラーハンドリング
- **リトライ戦略**: 指数バックオフ（1s, 2s, 4s）、最大3回
- **サーキットブレーカー**: 連続失敗5回で30秒間オープン
- **DLQ**: 処理失敗メッセージは専用DLQに保存
- **アラート**: CloudWatch Alarmsでエラー率監視（閾値: 1%）

## 8. 監視・運用

### 8.1 ログ戦略
- **形式**: JSON構造化ログ
- **レベル**: ERROR, WARN, INFO, DEBUG
- **保持期間**: 30日（CloudWatch Logs）
- **検索**: CloudWatch Logs Insightsでクエリ

### 8.2 メトリクス
- **標準メトリクス**: Lambda実行時間、エラー数、スロットリング
- **カスタムメトリクス**: タイムライン更新遅延、WebSocket接続数
- **収集間隔**: 1分

### 8.3 アラート
- **エラー率**: > 1%（5分間持続）
- **レイテンシ**: p95 > 500ms（5分間持続）
- **DLQメッセージ数**: > 0
- **WebSocket切断率**: > 10%（1分間）

### 8.4 分散トレーシング
- **ツール**: AWS X-Ray
- **サンプリング**: 5%（通常）、100%（エラー時）
- **トレースID**: リクエストヘッダー `X-Amzn-Trace-Id` で伝播

## 9. デプロイメント

### 9.1 環境
- **dev**: 開発環境（手動デプロイ）
- **staging**: ステージング環境（自動デプロイ、main branchマージ時）
- **prod**: 本番環境（手動承認後デプロイ）

### 9.2 デプロイ戦略
- **Blue/Green**: Lambda エイリアス + CodeDeploy
- **カナリアリリース**: 10% → 50% → 100%（各ステップ5分間隔）
- **ロールバック**: 自動（エラー率 > 5%）

### 9.3 CI/CD
- **パイプライン**: GitHub Actions
- **ステップ**: lint → test → build → deploy
- **承認**: 本番デプロイ時のみ手動承認

## 10. コスト最適化

### 10.1 推定月額コスト（本番環境）
- **Lambda**: $20（100万リクエスト想定）
- **DynamoDB**: $10（オンデマンド、5,000件/日書き込み）
- **ElastiCache**: $15（cache.t3.micro）
- **API Gateway**: $5（100万リクエスト）
- **EventBridge**: $1（1,000万イベント）
- **CloudWatch**: $5（ログ・メトリクス）
- **合計**: 約$56/月

### 10.2 コスト削減策
- **DynamoDB**: オンデマンド → プロビジョニング（安定後）
- **Lambda**: メモリサイズ最適化（1024MB → 512MB）
- **ElastiCache**: dev環境は停止（業務時間外）
- **ログ**: 保持期間短縮（30日 → 7日、dev環境）

## 11. 将来拡張

### 11.1 次期バージョン候補機能
- **通知サービス**: プッシュ通知、メール通知
- **メディアサービス**: 画像・動画アップロード（S3 + CloudFront）
- **検索サービス**: Elasticsearch/OpenSearchによる全文検索
- **レコメンデーション**: 機械学習によるおすすめユーザー提案

### 11.2 スケーラビリティ改善
- **DynamoDB Global Tables**: マルチリージョン展開
- **CDN**: CloudFront導入（静的コンテンツ配信）
- **GraphQL API**: AppSyncによる効率的なデータ取得
- **イベントソーシング**: CQRS + Event Storeパターン

## 12. 参考資料

- [要件定義書](../requirements.md)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [マイクロサービスパターン](https://microservices.io/patterns/index.html)
- [CloudEvents Specification](https://cloudevents.io/)
