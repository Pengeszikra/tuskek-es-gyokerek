# Tüskék és Gyökerek

English-first, Hungarian-enabled company page for [3Draft](https://github.com/Pengeszikra/3Draft), [HEXAW](https://github.com/Pengeszikra/hexaw) and Spider Paint.

[Open the site](https://tuskek-gyokerek.petervivo.chatgpt.site/) (currently owner-only).

## Pages

| page | what it is |
|---|---|
| `dist/index.html` | the workshop: story intro, how the pieces fit, 3Draft, HEXAW, Spider Paint (R45 model), MCP, DEV journal, sandbox terminal |
| `dist/five-percent.html` | the Meta VR Start 2026 entry, with the VR training video at the top, the story, the VR guide, more videos and the DEV write-ups |
| `dist/spider-paint.html` | the first-person workshop / game builder for the community, building with an AI over MCP, replays, the 2015 roots |
| `dist/spi3der.html` | the long game: a 3D channel inside AI chats (ChatGPT today, Claude next), with the live native editor demo and the usage guide |
| `dist/science.html` | science and education: real catalogue data through MCP, the scale from atoms (planned) to the observable universe |

All pages share `style.css`, `app.js` (EN/HU switch, language-preserving links, progress bar, click-to-play YouTube, copy buttons, DEV feed) and the same header.

## Story intro

`dist/intro.js` is a silent, English-only canvas animation (about 52 seconds, no audio, no narration). About four seconds after the hero comes into view it fades in over the logo, tells the story — Thorns & Roots, HEXAW, 3Draft, Spider Paint, MCP, Five Percent, atoms to galaxies, spi3der — and fades back to the logo. It does not start by itself when the visitor prefers reduced motion or has already seen it in this browser session; a "Watch the story" button replays it. Add `?intro` to the URL to start it right away.

## Inline spi3der demo

The spi3der page embeds the **actual** spi3der editor from `https://spi3der.cloud.run/`, starting with the editable mechanical spider scene in [dist/assets/spi3der-spider.scene.json](dist/assets/spi3der-spider.scene.json). [dist/spi3der-demo.js](dist/spi3der-demo.js) compresses the scene with `deflate-raw` and passes it in the iframe's `#scene=` fragment; geometry and editing run in the spi3der app.

## Run locally

No build step or package installation is needed. Serve `dist/` over HTTP:

```sh
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000/`. Use the EN / HU switch for language.

The R45 loader is a 3Draft scene rendered with WebGPU, WebGL2 or SVG. Drag to orbit it, and use the download link to get `R45-Rakodo.scene.json`. The JavaScript modules under `dist/engine/` are a snapshot of the [3Draft engine](https://github.com/Pengeszikra/3Draft) used by this page. The latest DEV posts are loaded from DEV's public API; the page also links to the [RSS feed](https://dev.to/feed/pengeszikra) and [DEV post map](https://devto-post-map.vercel.app/).

## Deploy to Vercel

Import this GitHub repository as a new Vercel project. The included `vercel.json` selects the **Other** framework, skips the build command, and serves the checked-in `dist/` directory. Keep the project Root Directory at the repository root. No environment variables or npm install are required for this static page. The DEV journal loads client-side from DEV's public API.

After deployment, verify that the R45 scene loads and that `/assets/R45-Rakodo.scene.json` downloads. WebGPU and WebGL2 require browser support; SVG is the fallback.
