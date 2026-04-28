# AI Features

Jobrythm integrates **Google Gemini** via the `@google/genai` SDK to speed up data entry. AI features are entirely optional — Jobrythm functions normally without them.

---

## Setup

1. Get a free API key at <https://aistudio.google.com/app/apikey>.
2. Open **Admin → Settings → AI**.
3. Paste the key, choose a model, click **Save AI settings**.

Alternatively, set environment variables:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
```

DB-backed settings take precedence over env vars.

---

## Configuration

| Setting | DB key | Env fallback | Default |
|---|---|---|---|
| API key | `gemini_api_key` | `GEMINI_API_KEY` | _(unset)_ |
| Model | `gemini_model` | `GEMINI_MODEL` | `gemini-2.0-flash` |

Read at runtime via `getGeminiConfig()` in `src/utils/appSettings.ts`.

---

## Supported models

| Model | Notes |
|---|---|
| `gemini-2.5-pro-preview-05-06` | Most capable, best reasoning |
| `gemini-2.5-flash-preview-04-17` | Fast, great quality |
| `gemini-2.0-flash` | **Recommended default** — fast & free tier |
| `gemini-2.0-flash-lite` | Lightest, cheapest |
| `gemini-1.5-pro` | Stable, highly capable |
| `gemini-1.5-flash` | Stable, fast |

---

## Endpoints

All AI endpoints are implemented in `src/routes/ai.ts` and require authentication. Each one returns structured JSON, never raw text — the prompt instructs Gemini to respond with strict JSON which is then parsed and validated server-side.

### `POST /api/jobs/:id/ai-suggest-line-items`

Suggest line items for a given job based on:
- The job's title and description.
- The contractor's **historical line items across past jobs** (used as in-context examples so suggestions match their pricing patterns and naming).

Request:
```json
{ "prompt": "Replace 15m of copper pipe under the kitchen sink and fit a new mixer tap." }
```

Response (illustrative):
```json
{
  "items": [
    { "category": "labour",    "description": "Plumber labour (3h)", "quantity": 3, "unitPriceCents": 7500 },
    { "category": "materials", "description": "Copper pipe 15mm × 15m", "quantity": 1, "unitPriceCents": 4500 },
    { "category": "materials", "description": "Mixer tap",            "quantity": 1, "unitPriceCents": 12000 }
  ]
}
```

### `POST /api/ai/suggest-client`

Parse a free-text contact description into structured client fields.

Request:
```json
{ "prompt": "Sarah Jenkins, 07700 900123, sarah.j@example.com, lives at 12 Park Lane, Manchester. Prefers email contact." }
```

Response (illustrative):
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah.j@example.com",
  "phone": "07700 900123",
  "address": "12 Park Lane, Manchester",
  "notes": "Prefers email contact."
}
```

### `POST /api/ai/suggest-job`

Parse a free-text job description into structured job fields (title, description, scheduled start/end).

---

## UI integration

- **Job detail page** → "✨ Suggest line items" button on the line-items tab.
- **Client create form** → "✨ Autofill from description" textarea.
- **Job create form** → "✨ Autofill from description" textarea.

Each AI button is rendered as **disabled with a tooltip** when `aiConfigured` is `false` in the user's `AppSettings` payload.
