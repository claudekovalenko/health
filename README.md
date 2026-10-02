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

The app is organised by **profile** — one per thing you're working on. The nav
bar is the list of them: Today, then a chip per profile, then Coins.

**A profile** is everything about one part of you, in one place:

- **Findings** — what your own entries are saying, written as sentences and
  updated as you log. *"Hamstring curl machine: tingling down the leg runs 6.2
  on those days against 2.0 otherwise (5 days vs 18)."*
- **Background & history** — injuries, surgeries, dates. The context a clinician
  would want, kept with the data rather than in your head.
- **Today** — check off habits, tag what the day was like, rate how it feels.
- **Over time** — habits kept over 14 days, and a sparkline per rating with this
  week against last.
- **Recent notes** — your own words.
- **Take it to an appointment** — all of the above as plain text, copyable or
  downloadable.
- **Set up this profile** — collapsed at the bottom: habits, ratings, tags,
  colour, name.

**Today** is the quick daily pass: the rings up top (tap one to open its
profile), then every profile's check-ins in one scroll, then a note field.

**Coins** bank as you check habits off, and are spent on real things that move a
profile forward. It also points at whichever profile is lagging.

**Rings** show rolling 7-day consistency, not "did you do everything today".
For each habit the ring asks: of your weekly target, how much did you hit?
Those are averaged, weighted by how much each habit is worth. Miss a day and the
ring dips slightly instead of resetting to zero — the thing you're measuring is
a pattern, not a single day.

**Ratings** are the other half: habits are the input, ratings are the output.
A profile can carry as many as it needs. When today's reading is unusual it says
so under the slider — *worst in 23 days* — by looking back for the last day that
was this bad or this good.

**Day tags** record what a day was like, tapped on Today or on the profile.
Mark one as an *exposure* (something you were subjected to) or a *protection*
(something you did about it), and Findings compares your ratings across them,
including protected vs unprotected days within an exposure. Every comparison
carries its sample size and stays quiet until it has one worth trusting.

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
