# Paradox Audio

Open `dist/index.html` in a browser to use the prototype. On desktop the supplied image is the landing page, with working controls layered over its navigation, buttons and dashboard touchscreen. On narrow screens the headline and buttons reflow above a crop of the same dashboard. The touchscreen opens a larger console for reading and typing, and the most recent reply appears on the dashboard when the console is closed.

## Deploy on Vercel

Import the GitHub repo in Vercel and leave the Root Directory at the repository root. The included `vercel.json` selects the Other preset, skips the build, and serves `dist/`.

## Connecting an assistant

The question flow uses sample replies by default. For a live assistant, add a Vercel Function at `api/tune.mjs` at the repository root and store the provider key in the Vercel project's Environment Variables. A client integration can listen for `paradox:question` on `window` and call `event.preventDefault()` synchronously to take over the response. Send `event.detail.question` to `/api/tune` and pass the returned text to `window.paradoxConsole.showReply(text)`. If the request fails, use the same method to display an error message.

Call `window.paradoxConsole.showView(view)` to open the console in one of these views. The method returns `false` for an unknown view.

- `services`
- `process`
- `questions`
