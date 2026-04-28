# Status Workflows

All status enums in Jobrythm use **lowercase string values** (e.g. `'draft'`, `'sent'`, `'paid'`). They live in `src/types/enums.ts` and are mirrored as TypeScript union types on the frontend.

---

## Job

```
Draft  →  Quoted  →  Active  →  Completed  →  Invoiced
```

| Status | Meaning |
|---|---|
| `draft` | Created but not yet sent to the client |
| `quoted` | A quote has been issued |
| `active` | Work is in progress |
| `completed` | Work is finished |
| `invoiced` | Invoice has been issued for the completed work |

Updated via `PATCH /api/jobs/:id/status`.

---

## Quote

```
Draft  →  Sent  →  Accepted | Rejected | Expired
```

| Status | Meaning |
|---|---|
| `draft` | Created, not yet sent |
| `sent` | Sent to the client (PDF attached, public link generated) |
| `accepted` | Client accepted |
| `rejected` | Client rejected |
| `expired` | Past expiry date |

A quote is **immutable once accepted/rejected**.

---

## Invoice

```
Draft  →  Sent  →  Paid | Overdue | Cancelled
```

| Status | Meaning |
|---|---|
| `draft` | Created, not yet sent |
| `sent` | Issued to the client |
| `paid` | Marked paid via `PATCH /api/invoices/:id/paid` |
| `overdue` | Past due date and unpaid (set by background job) |
| `cancelled` | Voided |

---

## Line item categories

`labour`, `materials`, `equipment`, `subcontractor`, `other` — used for cost-breakdown reporting.
