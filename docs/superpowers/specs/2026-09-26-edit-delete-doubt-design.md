# Edit & Delete Doubt — Design Spec

Date: 2026-09-26
Status: Approved
Feature: Students can edit or delete their own doubts only while status is PENDING.

## Context

SufalPhysicsForum already models doubts as `ForumQuestion` (title, body, optional `imageUrl`, `isResolved`, author, batch, answers). This feature extends that model. It does not introduce a separate `Doubt` table.

MySQL is the database. Prisma `String[]` is not used for image URLs.

## Goals

- Owner-only edit and delete of a doubt.
- Edit and delete allowed only while `status === PENDING`.
- A teacher or SUPER_ADMIN answer moves the doubt to `ANSWERED` and locks edit/delete.
- Classmate answers do not lock the doubt.
- Image assets are stored in a related table and removed from Cloudinary when deleted or replaced, to avoid storage bloat.
- UI shows Edit/Delete only when the current user owns the doubt and it is PENDING.

## Non-goals

- No `IN_PROGRESS` / teacher-claim workflow.
- No edit/delete of answers.
- No teacher override to edit a student's doubt.
- No change to the existing Resolved (`isResolved`) badge or resolve endpoint semantics.

## Data model

Keep `ForumQuestion`. Add:

```prisma
enum DoubtStatus {
  PENDING
  ANSWERED
}

model ForumQuestion {
  id         String      @id @default(cuid())
  title      String
  body       String      @db.Text
  status     DoubtStatus @default(PENDING)
  isResolved Boolean     @default(false)
  authorId   String
  batchId    String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  author  User                  @relation(fields: [authorId], references: [id], onDelete: Cascade)
  batch   Batch                 @relation(fields: [batchId], references: [id], onDelete: Cascade)
  answers ForumAnswer[]
  images  ForumQuestionImage[]

  @@index([batchId])
  @@index([authorId])
}

model ForumQuestionImage {
  id         String   @id @default(cuid())
  questionId String
  url        String
  publicId   String
  createdAt  DateTime @default(now())

  question ForumQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
}
```

- Drop `ForumQuestion.imageUrl` after migrating any existing value into `ForumQuestionImage`. No transitional serializer: list/get/create/update all return `images` and never `imageUrl`.
- Existing rows with no image become questions with an empty `images` relation.
- Existing rows with `imageUrl` become one `ForumQuestionImage` row. `publicId` is extracted from the Cloudinary URL when possible; otherwise stored as empty string and Cloudinary destroy is skipped for that row.
- `isResolved` remains for the Resolved badge. It is independent of `DoubtStatus`.
- `ForumAnswer.imageUrl` is unchanged (answers stay single-image).

### Status transitions

| Event | Result |
| --- | --- |
| Student creates a question | `PENDING` |
| Classmate posts an answer | stays `PENDING` |
| TEACHER or SUPER_ADMIN posts an answer | `ANSWERED` |
| Author or teacher marks resolved | `isResolved = true`; status unchanged |

No reverse transition from `ANSWERED` back to `PENDING`.

## API

Both routes require `authenticate`. Institute scope is enforced the same way as existing forum handlers (`batch.instituteId === req.user.instituteId`).

Auth identity is `req.user.userId` (existing `AuthUser` shape). Ownership is `question.authorId === req.user.userId`.

### PUT `/forum/questions/:id`

Update a PENDING doubt owned by the caller.

**Guards (in order):**

1. Question exists in the user's institute, else 404 `{ success: false, message: 'Question not found' }`.
2. `authorId === req.user.userId`, else 403 `{ success: false, message: 'Only the author can edit this question' }`.
3. `status === PENDING`, else 409 `{ success: false, message: 'Only PENDING doubts can be edited' }`.

**Body (multipart):**

- `title` (optional string)
- `body` (optional string)
- `removeImageIds` (optional JSON array of image ids, or repeated form fields)
- `images` (optional new files, multer array, same JPEG/PNG/WebP 5MB rules as create)

At least one of title, body, new files, or removeImageIds must be present, else 400.

**Image handling:**

1. Upload new files to Cloudinary folder `forum/questions`. Persist `{ url, publicId }` rows.
2. For each `removeImageIds` id that belongs to this question: `cloudinary.uploader.destroy(publicId)` then delete the row.
3. Destroy failures are logged; the DB write still proceeds so a CDN miss cannot block the edit.
4. Images not listed in `removeImageIds` remain.

**Response:** 200 `{ success: true, data: question }` including `author`, `images`, `_count.answers`.

### DELETE `/forum/questions/:id`

Delete a PENDING doubt owned by the caller.

**Guards:** same as update (404 / 403 / 409) with messages `Only the author can delete this question` and `Only PENDING doubts can be deleted`.

**Image handling:** destroy every `ForumQuestionImage.publicId` on Cloudinary, then `prisma.forumQuestion.delete`. Image rows cascade. Destroy failures are logged; the DB delete still proceeds.

**Response:** 200 `{ success: true, data: { id } }`.

### Existing `addAnswer` change

After creating the answer, if `req.user.role` is `TEACHER` or `SUPER_ADMIN` and the question is still `PENDING`, set `status = ANSWERED`. Classmate answers do not change status.

### Existing `createQuestion` change

Write uploaded images as `ForumQuestionImage` rows instead of `imageUrl`. Create keeps the existing single-file field name `image` so the current Ask a Doubt modal does not break. Update accepts multiple files as `images`. Create still defaults `status` to `PENDING`.

List and get endpoints include `images` and `status` in the payload.

## Cloudinary

Add `deleteImageFromCloudinary(publicId: string)` in `server/src/utils/cloudinary.ts` wrapping `cloudinary.uploader.destroy`. Skip destroy when `publicId` is empty. Uploads must persist `result.public_id` in addition to `result.secure_url`.

## Frontend

Files: `client/src/api/forum.api.ts`, `client/src/pages/dashboard/DoubtForum.tsx`.

`ForumQuestion` type gains `status: 'PENDING' | 'ANSWERED'` and `images: { id: string; url: string }[]`. `publicId` is server-only and is not sent to the client. Drop `imageUrl` from the client type.

New API helpers: `updateQuestion(id, FormData)`, `deleteQuestion(id)`.

### Question card kebab

On each `QuestionCard`, render Heroicons `EllipsisVerticalIcon` only when:

```
currentUser.id === question.authorId && question.status === 'PENDING'
```

The kebab `stopPropagation` so it does not expand/collapse the card. Menu items:

- **Edit** — opens edit modal (title, body, existing images with remove, new uploads). Submit `PUT`. On success, patch the card and thread in local state.
- **Delete** — confirm dialog, then `DELETE`. On success, remove the card from the list and close any expanded thread.

If the user is not the owner or status is not PENDING, no menu is rendered.

409 from the API (teacher answered while the modal was open) surfaces as an inline error: the doubt can no longer be edited or deleted. Refresh local `status` from the error path or a refetch.

Heroicons is used for the kebab only. Existing lucide-react icons elsewhere stay as-is. Add `@heroicons/react` if it is not already a client dependency.

## Error handling

| Condition | HTTP | Client |
| --- | --- | --- |
| Not found / wrong institute | 404 | Toast / inline error |
| Not owner | 403 | No menu; API still enforces |
| Not PENDING | 409 | Inline error, hide menu after refetch |
| Validation | 400 | Inline form error |
| Cloudinary destroy fail | logged, request succeeds | none |
| Cloudinary upload fail on update | 500 if all new uploads fail; partial success if some files uploaded | inline error |

## Testing

- Unit/controller: owner + PENDING update succeeds; non-owner 403; ANSWERED 409; teacher answer flips status; classmate answer does not; delete destroys images then row.
- Client: kebab hidden for non-owner and ANSWERED; shown for owner PENDING; edit/delete handlers called.

## Rollout

1. Prisma schema + migration (add enum, image table, backfill from `imageUrl`, drop `imageUrl`).
2. Cloudinary helper + controller/routes.
3. Client types, API, QuestionCard kebab, edit modal, delete confirm.
4. Seed/create path writes image rows instead of `imageUrl`.
