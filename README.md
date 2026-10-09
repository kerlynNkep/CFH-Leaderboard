# CFH-Leaderboard

A single-page leaderboard for the CyberFoundHer Mentorship Program.
It reads monthly scores from a published Google Sheet and displays the
top five, with a search so any mentee can find her own position.


---

## How it fits together

```
Google Sheet  ──(published as CSV)──▶  index.html  ──▶  GitHub Pages
  you edit                              fetches            serves at
  monthly                               on load       leaderboard.cyberfoundher.org
```

There is no database and no login. The sheet is the database. You edit
it once a month and the page picks up the change on the next load.

---

## Part 1 — The Google Sheet

Create a new sheet with this exact shape. The first column is the name.
Every column after it is one month, and the heading you type becomes the
label on the board.

| Name            | October | November | December |
|-----------------|---------|----------|----------|
| Amara Okonkwo   | 480     | 300      |          |
| Zainab Diallo   | 455     | 340      |          |
| Thandiwe Moyo   | 430     | 260      |          |

Rules that matter:

- Put **only names and monthly totals** in this sheet. It becomes
  readable by anyone with the link, so keep attendance notes, contact
  details and anything personal in your private tracker.
- One row per mentee. Blank cells count as zero.
- Add the next month by adding a column. Nothing in the code changes.
- If you keep a wider tracker elsewhere, use a formula in this sheet to
  pull the monthly total across, so you only ever maintain one file.

### Publish it

1. **File → Share → Publish to web**
2. Under *Link*, choose the scores sheet (not "Entire document")
3. Change the format to **Comma-separated values (.csv)**
4. Click **Publish**, confirm, and copy the link

The link looks like:

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vT.../pub?gid=0&single=true&output=csv
```

---

## Part 2 — The page

Open `index.html` and set one line near the bottom:

```js
var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv";
var TOP_N = 5;   // change to 10 if you want a longer board
```

That is the only configuration. Save, and open the file in a browser to
check it loads.

---

## Part 3 — Hosting on GitHub Pages

1. Create a repository, for example `cyberfoundher-leaderboard`
2. Upload `index.html` and `CNAME`
3. **Settings → Pages →** set *Source* to `main` branch, `/root`
4. Wait a minute, then open the `github.io` address it gives you

### Your own domain

1. Edit `CNAME` so it contains only your subdomain:
   ```
   leaderboard.cyberfoundher.org
   ```
2. In Hostinger, open the DNS zone for `cyberfoundher.org` and add:

   | Type  | Name        | Points to              | TTL     |
   |-------|-------------|------------------------|---------|
   | CNAME | leaderboard | `<username>.github.io` | default |

3. Back in **Settings → Pages**, enter the same domain under
   *Custom domain*, then tick **Enforce HTTPS** once it becomes available.

DNS can take anywhere from a few minutes to a few hours. Hosting,
bandwidth and the HTTPS certificate all cost nothing.

---

## The monthly routine

1. Update the month's column in the sheet
2. That is it

Google caches published sheets for around five minutes, so a change is
live within a few minutes rather than instantly.

---

## If something goes wrong

**"Could not load the scores."**
The sheet is not published, or the link is wrong. Re-publish and copy the
CSV link again. Check it ends in `output=csv`.

**"The sheet is empty."**
The first row needs a Name heading and at least one month heading.

**A mentee is missing from the board.**
Her score for that month is blank or zero. People with no points are not
listed.

**The board shows an old month.**
The page opens on the most recent month that has any scores in it.

---

## Files

| File         | What it is                                  |
|--------------|---------------------------------------------|
| `index.html` | The whole application                       |
| `CNAME`      | Your custom domain, one line, no `https://` |
| `README.md`  | This guide                                  |