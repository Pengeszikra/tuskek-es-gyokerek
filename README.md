# Tüskék és Gyökerek

English-first, Hungarian-enabled company page for [3Draft](https://github.com/Pengeszikra/3Draft), [HEXAW](https://github.com/Pengeszikra/hexaw) and Spider Paint.

[Open the site](https://tuskek-gyokerek.petervivo.chatgpt.site/) (currently owner-only).

## ChatGPT spi3der workshop

The main page's **AI at the workbench / Give your agent real tools** section now introduces the ChatGPT-embedded spi3der MCP App. The full bilingual story, architecture, usage instructions, limitations, and roadmap live at [dist/spi3der.html](dist/spi3der.html) and at `/spi3der.html` on the deployed site.

Both pages use the site's EN/HU language switch. Links between the main MCP section and the workshop guide preserve `?lang=en` or `?lang=hu`.

The guide distinguishes verified embedded model rendering from the experimental shared-session protocol documented upstream in [spi3der/WORKSHOP.md](https://github.com/Pengeszikra/spi3der/blob/main/WORKSHOP.md).

## Inline spi3der demo

The main page's **AI at the workbench / Give your agent real tools** section embeds the **actual** spi3der editor from `https://spi3der.cloud.run/`, starting with the editable 30-object mechanical spider scene in [dist/assets/spi3der-spider.scene.json](dist/assets/spi3der-spider.scene.json).

[dist/spi3der-demo.js](dist/spi3der-demo.js) fetches that saved 3Draft scene, compresses it with the editor's supported `deflate-raw` format, and sets the native iframe's `#scene=` fragment. Geometry and editing still run in the spi3der browser app; this site does **not** implement a parallel 3D editor or require an MCP connection just to orbit the public demo. If the browser cannot prepare the fragment, the page offers a link to the native app and the scene download. Browsers must support `CompressionStream('deflate-raw')`.

The separate [spi3der guide](dist/spi3der.html) uses [transparent spider artwork](dist/assets/spi3der-spider-transparent.svg), and both pages have a dedicated spi3der navigation entry. The SVG keys dark pixels to transparent while retaining the original embedded spider artwork; it is distinct from the 3D model.

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
