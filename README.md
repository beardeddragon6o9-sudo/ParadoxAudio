# Paradox Audio

Open `dist/index.html` in a browser to use the prototype. The dashboard touchscreen wakes into the question view when the page loads. Questions, replies, services and tuning prerequisites stay inside the display. On desktop the screen's zoom button brings the dashboard closer. On narrow screens the screen is taller, with room for typing and scrolling.

## Deploy on Vercel

Import the GitHub repo in Vercel and leave the Root Directory at the repository root. The included `vercel.json` selects the Other preset, skips the build, and serves `dist/`.

## Connecting an assistant

The deployed Ask screen sends questions to `/api/tune`, which calls the OpenAI Responses API from a Vercel Function. Set `GPT_MODEL` to `gpt-5.6-luna` and `API_SECRET` to the OpenAI API key in the Vercel project's Environment Variables for the deployment you're testing. Opening `dist/index.html` from disk still uses sample replies.

A custom integration can listen for `paradox:question` on `window` and call `event.preventDefault()` synchronously to take over. Read `event.detail.question` and call `window.paradoxConsole.showReply(text)` with an answer or an error message to settle Ping's visor state.

Call `window.paradoxConsole.showView(view)` to switch the touchscreen to one of these views. The method returns `false` for an unknown view.

- `services`
- `prerequisites`
- `questions`
- `contact`

The legacy `process` view opens Services.

## Email inquiries

The Contact form posts to `/api/contact` in the existing Vercel project. The function sends through Gmail to `ParadoxDSPtuning@gmail.com` and sets Reply-To to the visitor's email.

Enable 2-Step Verification on the work Gmail account and [create a Google app password](https://support.google.com/accounts/answer/185833). Add it as `GMAIL_APP_PASSWORD` to the Vercel environment you're testing, then deploy. Keep that value in Vercel's server-side environment settings.
