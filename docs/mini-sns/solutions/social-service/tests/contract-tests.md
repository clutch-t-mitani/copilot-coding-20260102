# 契約テスト

## 1. Consumer Driven Contract

詳細は../../design/service-interfaces.md#契約テストを参照。

## 2. テストケース

### 2.1 公開API契約

- OpenAPIスキーマ準拠検証
- リクエスト/レスポンス型検証
- エラーレスポンス検証

### 2.2 イベント契約

- CloudEventsスキーマ検証
- イベントデータ型検証
- バージョン互換性検証
