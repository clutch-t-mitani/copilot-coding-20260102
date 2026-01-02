# Idempotency-Key設計

## 1. 対象API

- POST /posts（投稿作成）
- POST /users/{id}/follow（フォロー）
- POST /posts/{id}/likes（いいね）

## 2. 実装方式

- Idempotency-Keyヘッダー（UUID形式）
- DynamoDBで処理済みキーを記録（TTL: 24時間）
- 重複リクエストは同一結果を返却

詳細は../../design/service-interfaces.md#重複排除を参照。
