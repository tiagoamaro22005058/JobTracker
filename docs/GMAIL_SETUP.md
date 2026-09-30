# Connect Gmail to JobTrack

The Emails page is built. One Google Cloud setup is needed before the **Connect Gmail** button becomes available.

For the current JobTrack deployment, `MAIL_ENCRYPTION_KEY` and `MAIL_APP_ORIGIN` are already configured in Vercel. You only need to create the Google client and add its two credentials.

## 1. Create the Google project

Open [Google Cloud Console](https://console.cloud.google.com/), select the project picker at the top, and create a project called **JobTrack**. Select that project.

Open **APIs & Services → Library**, search for **Gmail API**, and click **Enable**.

## 2. Set up the consent screen

Open **Google Auth Platform** (or **APIs & Services → OAuth consent screen**) and click **Get started** if prompted.

- App name: **JobTrack**.
- User support email and developer contact: your email address.
- Audience: **External** for a personal Gmail account.
- Keep the publishing status at **Testing** initially.
- Under **Audience → Test users**, add the Gmail address you want to connect. Other testers must be added here too.
- Under **Data Access → Add or remove scopes**, add exactly `https://www.googleapis.com/auth/gmail.readonly` and save.

This scope lets JobTrack read your inbox. The app does not request permission to send, delete, or modify messages. Google describes the scope as restricted; for a wider public launch, review its verification requirements before moving out of testing. External apps in Testing normally receive refresh tokens that expire after seven days, so you may need to reconnect weekly. [Google scope documentation](https://developers.google.com/workspace/gmail/api/auth/scopes), [verification requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification), [token expiration](https://developers.google.com/identity/protocols/oauth2#expiration).

## 3. Create the OAuth client

Go to **Google Auth Platform → Clients → Create client**.

- Application type: **Web application**.
- Name: **JobTrack website**.
- Under **Authorized redirect URIs**, add this exact address:

```text
https://jobtracker-eight-brown.vercel.app/api/mail/callback
```

Click **Create**. Save the **Client ID** and **Client secret**. This is a server-side flow, so no JavaScript origin is needed. Do not paste the client secret into chat or commit it to GitHub. [Google's web application setup](https://developers.google.com/identity/protocols/oauth2/web-server).

## 4. Add the credentials to Vercel

Open [JobTrack's Vercel project](https://vercel.com/ccdylan-1008s-projects/jobtracker), then **Settings → Environment Variables**.

Add these two variables for **Production**:

| Name                   | Value                                            |
| ---------------------- | ------------------------------------------------ |
| `GOOGLE_CLIENT_ID`     | The Client ID from Google                        |
| `GOOGLE_CLIENT_SECRET` | The Client secret from Google; mark it sensitive |

Keep the existing `MAIL_ENCRYPTION_KEY` and `MAIL_APP_ORIGIN` values. None of these names should begin with `NEXT_PUBLIC_`.

After saving, tell Codex **“Gmail credentials added”**, or redeploy the latest production deployment from Vercel's Deployments page. New environment variables take effect after a deployment.

## 5. Connect your inbox

Open [JobTrack Emails](https://jobtracker-eight-brown.vercel.app/emails), sign in to JobTrack, and click **Connect Gmail**. Choose the Gmail account you added as a test user and allow read-only Gmail access.

You should see your latest inbox messages. Select a message to read it, use **Older emails** to move through the inbox, or **Refresh** to return to the latest messages. **Disconnect** clears the connection in this browser and requests revocation of Google's token. Google revocation can also invalidate connections for the same Google account in other browsers.

## What this first version supports

- One Gmail account per browser, bound to the signed-in JobTrack user.
- Fifteen inbox messages per page, sender, subject, date, and unread indicator.
- Formatted HTML emails in a full-width reader, with plain-text fallback and previous/next controls. Attachments can be opened with **Open in Gmail**.
- HTML is sanitized and isolated in a sandboxed frame. Scripts, forms, embedded pages, and CSS network requests are blocked. External images remain hidden until you choose **Show images** for a message; doing so contacts the sender's image servers and may load tracking pixels. Links open in a new tab.
- No automatic marking as read, sending, deleting, attachment downloads, or background synchronization.
- Emails are fetched on demand and not saved to Supabase or browser local storage. The page keeps displayed emails in memory while open.
- The refresh token is AES-256-GCM encrypted in an HttpOnly cookie with a 30-day lifetime. Only the server can decrypt it, and every mail request validates the signed-in JobTrack user. Access tokens remain server-side. Google may expire or revoke access sooner.
- Signing out of JobTrack blocks access to the inbox. Use **Disconnect** to remove the saved Gmail connection, including before sharing this browser with someone who uses your JobTrack account.
- The public demo uses clearly labeled sample emails and never accesses Gmail.

## Troubleshooting

| What you see                             | What to check                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Gmail setup is in progress               | Both Google credentials must be saved in Production, followed by a redeployment.                                                |
| `redirect_uri_mismatch`                  | The redirect URI must match the address in step 3 exactly, including `/api/mail/callback`.                                      |
| Google blocks the account during testing | Add that exact Gmail address under Audience → Test users.                                                                       |
| Permission request fails                 | Enable the Gmail API, add the read-only scope, and allow the requested permission.                                              |
| Connection expired                       | Reconnect Gmail. This is expected when Google's testing token expires.                                                          |
| Google access cannot be revoked          | Remove JobTrack from [Google Account connections](https://myaccount.google.com/connections). The local cookie is still cleared. |

## Local development or a different deployment

For another installation, set `MAIL_APP_ORIGIN` to the canonical origin without a trailing slash and generate a fresh 32-byte hexadecimal `MAIL_ENCRYPTION_KEY`. Keep the key in private environment variables. Changing the key disconnects existing Gmail sessions. The current workspace has a local key already.

For local testing, use `MAIL_APP_ORIGIN=http://localhost:3000`, set the Google credentials in the ignored `.env.local`, and register `http://localhost:3000/api/mail/callback` as another authorized redirect URI. Use a separate OAuth client for development when possible. Gmail is intentionally not configured on Vercel preview deployments.
