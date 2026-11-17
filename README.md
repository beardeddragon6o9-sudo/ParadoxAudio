# Paradox Audio

Open `dist/index.html` in a browser to use the prototype. The dashboard touchscreen wakes into the question view when the page loads. Questions, replies, services and the tuning process stay inside the display. On desktop the screen's zoom button brings the dashboard closer. On narrow screens the screen is taller, with room for typing and scrolling.

## Deploy on Vercel

Import the GitHub repo in Vercel and leave the Root Directory at the repository root. The included `vercel.json` selects the Other preset, skips the build, and serves `dist/`.

## Connecting an assistant

The deployed Ask screen sends questions to `/api/tune`, which calls the OpenAI Responses API from a Vercel Function. Set `GPT_MODEL` to `gpt-5.6-luna` and `API_SECRET` to the OpenAI API key in the Vercel project's Environment Variables for the deployment you're testing. Opening `dist/index.html` from disk still uses sample replies.

A custom integration can listen for `paradox:question` on `window` and call `event.preventDefault()` synchronously to take over. Read `event.detail.question` and call `window.paradoxConsole.showReply(text)` with an answer or an error message to settle Ping's visor state.

Call `window.paradoxConsole.showView(view)` to switch the touchscreen to one of these views. The method returns `false` for an unknown view.

- `services`
- `process`
- `questions`
