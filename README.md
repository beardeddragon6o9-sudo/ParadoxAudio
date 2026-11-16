# Paradox Audio

Open `dist/index.html` in a browser to use the prototype. The dashboard touchscreen wakes into the question view when the page loads. Questions, replies, services and the tuning process stay inside the display. On desktop the screen's zoom button brings the dashboard closer. On narrow screens the screen is taller, with room for typing and scrolling.

## Deploy on Vercel

Import the GitHub repo in Vercel and leave the Root Directory at the repository root. The included `vercel.json` selects the Other preset, skips the build, and serves `dist/`.

## Connecting an assistant

The question flow uses sample replies by default. For a live assistant, add a Vercel Function at `api/tune.mjs` at the repository root and store the provider key in the Vercel project's Environment Variables. A client integration can listen for `paradox:question` on `window` and call `event.preventDefault()` synchronously to take over the response. Send `event.detail.question` to `/api/tune` and pass the returned text to `window.paradoxConsole.showReply(text)`. If the request fails, use the same method to display an error message.

Call `window.paradoxConsole.showView(view)` to switch the touchscreen to one of these views. The method returns `false` for an unknown view.

- `services`
- `process`
- `questions`
