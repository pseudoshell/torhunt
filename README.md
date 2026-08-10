# torhunt

A sleek, zero-setup torrent finder and downloader that lives right in your terminal.

Finding a torrent these days sucks. One site is a minefield of fake download buttons. Another hides the real link under a popup that spawns two more tabs. And after all that, half the results are dead, zero seeders.

torhunt fixes that. One search checks a short, curated list of reputable sources at once, and whatever you pick downloads straight to your computer. No browser, no ads, no nonsense. The files are yours, saved to your downloads folder.

## Get started

1. **Install Node** (from [nodejs.org](https://nodejs.org)), it's all torhunt needs.
2. **Open your terminal.**
3. **Start it:**

   ```sh
   npx torhunt
   ```

That's it. torhunt opens straight to a search bar: search for what you want, paste in a magnet link or a bare infohash, or just press Enter on an empty box to browse the curated library. From there it's all keypresses — nothing to memorize, and `?` brings up the full list anytime.

## Features

- **Instant search** — type and hit Enter. Results stream in from every source, tagged with size and peer count so you can see what'll come down fast.
- **One-key downloads** — arrow to what you want and press `d` to save it, or `D` to pick a different folder for just that download.
- **Background downloads** — keep searching while downloads run. Queue up as many as you want.
- **Resume on restart** — anything interrupted picks up where it left off.
- **Seeding controls** — finished downloads seed automatically. Pause or stop anytime from the Seeding tab.
- **Completed library** — every finished download is archived in the Completed tab, grouped by date (Today, Yesterday, Older).
- **Settings panel** — change your download folder, color theme, and spinner style from within the app.
- **Global search** — press `/` from anywhere to jump straight to search.
- **Customizable themes** — multiple built-in color themes to match your terminal aesthetic.
- **Quality filters** — filter results by quality (4K, 1080p, 720p, x265, FLAC, FitGirl) with a single keypress.

## What it searches

A short, hand-picked list of trusted sources:

| Category | Sources |
| --- | --- |
| Games | FitGirl |
| Movies | YTS, The Pirate Bay, 1337x, BitTorrented |
| TV | EZTV, The Pirate Bay, 1337x, BitTorrented |
| Anime | Nyaa, SubsPlease |

Games are the only category that can run code, so they come from FitGirl alone, a repacker with a long, trusted track record. Everything else is plain video and subtitles. If a source is down, the search carries on without it, and torhunt tells you which one is offline.

## Headless mode

torhunt also runs without the TUI, for servers and seedboxes:

```
torhunt watch <dir>    download anything dropped into a folder
torhunt serve          take magnets over HTTP
torhunt files          stream finished downloads over HTTP
torhunt attach         keep the TUI alive across ssh sessions
```

Add `--daemon` to keep watch, serve, or files running after you log out. Run `torhunt --help` for the full list of modes and flags.

## Privacy

Your files stay on your disk, and nothing routes through a central server — torhunt only talks to the torrent network directly. Once a download finishes it keeps seeding by default, sharing it back so the next person can find it too. Opt out anytime from the Seeding tab.

## Development

```sh
git clone <repo-url>
cd torhunt
npm install
npm run dev
```

`npm run dev` runs the live TUI through tsx, no build step needed. To build and run the bundled version:

```sh
npm run build
npx torhunt
```
