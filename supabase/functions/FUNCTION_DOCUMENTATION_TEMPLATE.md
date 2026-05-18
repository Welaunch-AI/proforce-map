# Edge Function Documentation Template

Use this template for every new function under `supabase/functions/<function-name>/README.md`.

---

# `<function-name>` Function README

## Purpose

Explain the business goal in 1-2 lines.

## What it does

Step-by-step flow:
1. ...
2. ...
3. ...

## Inputs

- HTTP method / trigger
- Request payload fields
- Auth expectations

## Environment variables

- `...`
- `...`

## Database objects used

- Tables:
  - `schema.table_a`
  - `schema.table_b`
- Migration file:
  - `supabase/migrations/<timestamp>_<name>.sql`

## Transform/normalization rules

- Sentinel/null handling
- Type coercion
- Any business filtering logic

## Update/write semantics

- Upsert keys
- Freshness/staleness rules
- Idempotency strategy

## Response shape

Success fields:
- `...`

Failure fields:
- `error`

## Failure and retry behavior

- What can fail
- Safe retry behavior
- Partial write behavior

## Deployment

```bash
supabase functions deploy <function-name>
```

## Local testing

```bash
supabase functions serve <function-name> --env-file .env
```

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/<function-name>' \
  --header 'Authorization: Bearer <JWT>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

## Operational notes

- Rate limits
- Batch sizing
- Monitoring/logging expectations

## Changelog

- `YYYY-MM-DD`: Initial version
