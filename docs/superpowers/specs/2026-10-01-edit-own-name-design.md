# Edit Own Display Name — Design Spec

Date: 2026-10-01
Status: Approved
Feature: Any logged-in user can edit their own display name from the dashboard sidebar.

## Context

Display name is a single `User.name` field on the shared User model (students, teachers, SUPER_ADMIN). It is not split into first/last name.

JWT payload is `{ userId, role, instituteId }` only. Name is not in the token.

On login the client stores `localStorage.userName` and `localStorage.user` (`{ id, name, email, role }`). `DashboardLayout` reads `userName` once and passes it to `Sidebar`, which shows the avatar initial and truncated name in the footer.

Forum questions/answers join `author.name` from the database, so they pick up a rename on the next fetch.

Institute Settings is a separate admin page for institute branding. This feature is personal profile name, not institute name.

## Goals

- Any authenticated user can change their own `User.name`.
- Entry point is a pencil on the sidebar name, opening a small modal.
- Validation: trim, 2–80 characters, non-empty.
- Sidebar updates immediately after a successful save via localStorage.
- No JWT refresh. Forum names update on next fetch.

## Non-goals

- No first/last name split.
- No email, phone, password, or avatar upload.
- No admin renaming other users.
- No profanity filter or character-class restriction beyond length.
- No live broadcast of the new name into already-loaded forum cards.

## Data model

No schema change. Continue using `User.name String`.

## API

`PATCH /auth/me` behind existing `authenticate`.

**Body:** `{ name: string }`

**Validation:** `name.trim()` required; length 2–80 inclusive; otherwise 400 `{ success: false, message: '...' }`.

**Write:** update `User.name` where `id === req.user.userId`. Do not accept other fields.

**Response:** 200 `{ success: true, data: { id, name, email, role } }`.

Existing `GET /auth/me` is unchanged and can be used to hydrate name if needed.

## Frontend

Sidebar footer: keep avatar + truncated name. Add a pencil button (`aria-label="Edit name"`) that opens a modal (same overlay pattern as Ask a Doubt): one text input prefilled with the current name, Save / Cancel.

On Save, call `PATCH /auth/me`. On success:

1. `localStorage.setItem('userName', data.name)`
2. Patch `localStorage.user.name`
3. Lift `userName` into `DashboardLayout` state so the sidebar re-renders without a full reload

On 400, show the server message inline. Cancel / overlay click closes without saving.

## Error handling

| Condition | HTTP | Client |
| --- | --- | --- |
| Missing / blank / too short / too long | 400 | Inline form error |
| Unauthenticated | 401 | Existing interceptor redirects to login |
| Server error | 500 | Inline “Could not update name” |

## Testing

- PATCH with valid name updates the row and returns the new name.
- Names under 2 or over 80 chars return 400.
- Another user’s id cannot be targeted (endpoint only uses `req.user.userId`).
- Sidebar pencil opens the modal; Save updates the footer label.

## Rollout

1. `updateMe` in `auth.controller.ts` + `PATCH /auth/me` in `auth.routes.ts`.
2. Client API helper.
3. Lift `userName` state in `DashboardLayout`; pencil + modal in `Sidebar`.
