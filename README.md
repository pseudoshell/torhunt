# torhunt

A fast, distraction-free torrent search engine and downloader built for your terminal.

Modern torrent searching is broken. Most indexers are cluttered with intrusive ads, misleading download buttons, and dead magnet links.

torhunt cuts through the noise. A single search queries a curated selection of reliable sources simultaneously, streaming results straight to your terminal and downloading directly to your system. No browser tabs, no popups, no hassle.

## Quick start

1. **Install Node.js** (v22+ from [nodejs.org](https://nodejs.org)).
2. **Open your terminal.**
3. **Launch:**

   ```sh
   npx torhunt
   ```

That's all it takes. torhunt opens directly to an interactive search prompt: type your query, paste a magnet link or infohash, or press Enter on an empty query to browse curated picks. Everything is controlled via simple hotkeys — press `?` anytime for the full keymap.

## Features

- **Concurrent search** — Query multiple indexers in parallel with real-time streaming results tagged by file size and live peer counts.
- **One-key downloads** — Navigate to any item and press `d` to start downloading, or `D` to choose a custom target directory.
- **Non-blocking queue** — Continue searching and browsing while transfers run in the background.
- **State auto-resume** — Interrupted downloads pick up seamlessly where they left off after a restart.
- **Seeding manager** — Finished downloads seed automatically. Pause, resume, or stop seeding anytime from the Seeding view.
- **Completed archive** — Organized record of finished downloads grouped by date (Today, Yesterday, Older).
- **In-app settings** — Change your download directory, color theme, and spinner animation on the fly.
- **Instant navigation** — Press `/` from any view to jump straight to the search field.
- **Custom visual themes** — Hand-crafted color palettes to match your terminal environment.
- **Quality filters** — Filter results by resolution and format (4K, 1080p, 720p, x265, FLAC, FitGirl) with a single keypress.

## Indexer sources

torhunt queries a curated list of trusted sources by category:

| Category | Sources |
| --- | --- |
| Games | FitGirl |
| Movies | YTS, The Pirate Bay, 1337x, BitTorrented |
| TV | EZTV, The Pirate Bay, 1337x, BitTorrented |
| Anime | Nyaa, SubsPlease |

Game downloads are restricted to FitGirl due to their verified repack safety track record. Movies, TV, and anime sources cover clean video and audio streams. If any source is offline, search continues smoothly while displaying a status indicator.

## Headless & server modes

torhunt includes headless background daemons for servers and seedboxes:

```sh
torhunt watch <dir>    download torrents or magnets dropped into a folder
torhunt serve          HTTP API for remote magnet submission
torhunt files          range-aware HTTP server for media streaming
torhunt attach         persistent tmux session for remote SSH usage
```

Append `--daemon` to run `watch`, `serve`, or `files` as background processes. `torhunt serve` also ships a built-in **web remote**: open `http://127.0.0.1:9161/` in any browser (phone included) to search all indexers, add magnets or info hashes, watch progress live, pause/resume, and manage seeding. Run with `--token` when exposing the port beyond loopback. Run `torhunt --help` for all commands and flags.

## Privacy & security

torhunt connects directly to the BitTorrent P2P swarm. No telemetry, tracking, or proxying through third-party servers. All files land on your local storage, and seeding behavior can be toggled anytime.

## Development

```sh
git clone https://github.com/pseudoshell/torhunt.git
cd torhunt
npm install
npm run dev
```

`npm run dev` launches the live TUI via `tsx`. To build and execute the production bundle:

```sh
npm run build
npx torhunt
```
