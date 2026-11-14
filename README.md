# Tüskék és Gyökerek

English-first, Hungarian-enabled company page for [3Draft](https://github.com/Pengeszikra/3Draft), [HEXAW](https://github.com/Pengeszikra/hexaw) and Spider Paint.

[Open the site](https://tuskek-gyokerek.petervivo.chatgpt.site/) (currently owner-only).

## Run locally

No build step or package installation is needed. Serve `dist/` over HTTP:

```sh
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000/`. Use the EN / HU switch for language.

The R45 loader is a 3Draft scene rendered with WebGPU, WebGL2 or SVG. Drag to orbit it, and use the download link to get `R45-Rakodo.scene.json`. The JavaScript modules under `dist/engine/` are a snapshot of the [3Draft engine](https://github.com/Pengeszikra/3Draft) used by this page. The latest DEV posts are loaded from DEV's public API; the page also links to the [RSS feed](https://dev.to/feed/pengeszikra) and [DEV post map](https://devto-post-map.vercel.app/).
