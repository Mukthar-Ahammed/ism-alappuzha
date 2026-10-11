# Email Implementation Later

## 1. Purpose

Email sending is intentionally paused for now. The public Q&A flow still accepts
and stores an optional email address, but visitors must save their Ticket ID and
use Check Status to read answers.

## 2. Current State

- The ask form keeps the optional email field.
- `/api/qa/ask` validates and stores the email when provided.
- `/api/qa/status` currently requires only the Ticket ID.
- Admins can see the stored email on the question detail screen.
- `sendReply` and `sendCorrection` still call the email interface.
- The email interface is a no-op stub and sends nothing.

## 3. Interim Behaviour

Until real email sending is implemented:

- Do not promise visitors that replies will be emailed.
- Ask form helper text should say:
  `"Optional. Email replies are not available yet, so please save your ticket ID to read the answer."`
- The success screen must clearly tell visitors to save the Ticket ID and that it cannot be recovered.
- Check Status should ask only for the Ticket ID.
- Keep email-match code available behind `REQUIRE_EMAIL_FOR_STATUS_CHECK`, defaulted to `false`.
- Do not add retry email UI.

## 4. Later Implementation

When email sending is ready:

1. Choose the provider, for example Resend or SMTP/Nodemailer.
2. Add provider credentials to server-only environment variables.
3. Implement the sender in `src/features/questions/server/email.ts`.
4. Record `email_log` rows for sent and failed messages.
5. Decide whether `/api/qa/status` should require email matching by setting
   `REQUIRE_EMAIL_FOR_STATUS_CHECK = true`.
6. Update public copy to say email replies are available.
7. Add retry email UI only after failure logging exists.

## 5. Safety Rules

- Never expose email provider secrets to the client bundle.
- Never log visitor emails or question text.
- Email sending must happen only from server code.
- Email failures must not roll back the saved answer.
- Visitors must always be able to read answered questions with their Ticket ID.
