# Growth Rings

A small, private tracker for the health areas you're actively working on — one
ring per area, coins for the work you put in, and a place to see whether things
are actually getting better.

Built as plain HTML/CSS/JS. No build step, no accounts, no network calls. Your
data lives in your browser's local storage and nowhere else.

**Live at https://claudekovalenko.github.io/health/** — served from this branch
by GitHub Pages on every push.

## Run it

Open the link above, or open `index.html` locally in a browser. That's it.

The Pages copy keeps your data in that browser's local storage. There's also a
copy published as a Claude Artifact, built from these same files, which keeps
your data on your Claude account so it follows you between phone and laptop.

If you want it to behave like a real app (and to be safe about storage in every
browser), serve it instead:

```sh
python3 -m http.server 8080   # then open http://localhost:8080
```

On a phone: open it, then **Add to Home Screen**. It opens full-screen and keeps
your data on that device.

## How it works

**Areas** are the things you want to grow in. It starts with four, taken from
what you're actually dealing with — ear (pulsatile tinnitus), right knee (ACL),
shoulder tightness, and teeth. Rename them, delete them, add sleep or nutrition
or anything else.

**Habits** live inside an area. Each has a target (how many times a week you're
aiming for) and a coin value (how much it's worth to you). Tap to check one off
for today.

The **Today** tab opens with a summary: the overall ring, then every area's ring
side by side, so the whole picture reads before you scroll. Tap one to jump to
that area.

**Rings** show rolling 7-day consistency, not "did you do everything today".
For each habit the ring asks: of your weekly target, how much did you hit? Those
are averaged, weighted by how much each habit is worth. Miss a day and the ring
dips slightly instead of resetting to zero — the thing you're measuring is a
pattern, not a single day.

**Coins** accumulate as you check things off. They're a running measure of
effort banked, and on the Invest tab you spend them on real things that push an
area forward — new earplugs, a PT session, a dental visit. The same tab points
at whichever area is lagging, since that's where one extra rep buys the most.

**The 0–10 rating** under each area is the other half of the picture: habits are
the input, the rating is the output. Tinnitus loudness, knee confidence,
shoulder tightness. The Progress tab puts this week's average against last
week's, so you can tell whether the work is doing anything.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page shell and tabs |
| `styles.css` | All styling, light and dark |
| `app.js` | Data model, scoring, rendering |
| `tools/build-artifact.js` | Bundles the three into one file for publishing |
| `dist/artifact.html` | That bundle — republish it to update the hosted copy |

Rebuild the bundle with `node tools/build-artifact.js` after any change.

## Your data

Everything is under the `growth-rings-v1` key in local storage. The hosted copy
also mirrors it to a single document on your Claude account, so an edit on your
phone shows up on your laptop; last write wins. That copy is private to you
unless you share the artifact link, and health notes are worth keeping unshared. **Areas →
Export backup** writes a JSON file; **Import backup** reads one back. Do that
before clearing site data or moving to a new phone.

## A note

This is a personal tracker, not medical advice, and nothing here diagnoses
anything. Pulsatile tinnitus in particular is worth a doctor's attention rather
than a habit app's. Use it to notice patterns and bring better information to
the people treating you.
