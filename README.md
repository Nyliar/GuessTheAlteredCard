# Who's That Character?

A browser game in the spirit of [Who's That Pokémon?](https://gearoid.me/pokemon/): an Altered card illustration is shown with the name hidden, and you type who it is.

There is one card each day, the same card until local midnight. You start on a high-contrast grayscale crop of one cell of the art (a random cell in a 4×3 grid), with a light blur. A miss shows the closest cell of a 3×3 split in softer grayscale, then the closest cell of a 2×3 split in color, then the closest cell of a 2×2 split, then the full card. A correct name scores 4, then 3, then 2, then 1. The first two looks both finish on a foil card. A hint reveals the type, then the faction, then the set, and each one costs a point. Missing the wider crop scores nothing. Every common and rare illustration from the sets turned on in `src/sets.json` can be drawn. The out-of-faction rare repeats the rare art, so it stays out. Neverending Journey (`FUGUE`) is listed there and left off until it should join the pool. The name field suggests cards in your browser's language. Today's result and the score stay in this browser.

This is an unofficial fan game and is not affiliated with Equinox. Names come from the community card database. Illustrations are loaded from `cdn.alteredcore.org` and are not part of this repository.

Connect Re:Union signs in with the players realm at `auth.altered.re` (Authorization Code and PKCE, scopes `openid profile`). The public client id is `whos-that-character`, or `VITE_REUNION_CLIENT_ID` when that is set. Re:Union has to register that client, allow this site's `/auth/callback` as a redirect URI, and allow the site origin as a web origin. The button then shows the player's name. The daily score stays in this browser.

## Run

```bash
npm install
npm run dev
```

`npm test` checks name matching. `npm run catalog` rebuilds `src/data/characters.json` from the community set files. `npm run build` makes a static site in `dist/`.
