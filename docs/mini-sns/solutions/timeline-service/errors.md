# エラー仕様

## RFC 7807/9457準拠

詳細は../../design/openapi.yaml#components/schemas/ProblemDetailを参照。

## エラータイプ

- ValidationError (400)
- Unauthorized (401)
- Forbidden (403)
- NotFound (404)
- Conflict (409)
- RateLimitExceeded (429)
- InternalServerError (500)

## リトライ可否

詳細は../../design/service-interfaces.mdを参照。
