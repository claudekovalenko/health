/* Growth Rings — a small, local-first tracker for the areas you want to grow in.
   Data model, scoring and rendering all live here. No build step, no network. */
(function () {
  'use strict';

  var KEY = 'growth-rings-v1';
  var PALETTE = ['#31d0aa', '#f2c14e', '#7aa2f7', '#f0a04b', '#e08bb0', '#7fd4e8', '#a3d977', '#c39bf5'];

  /* ---------------------------------------------------------------- defaults */

  function seed() {
    return {
      version: 1,
      areas: [
        {
          id: 'ear', name: 'Ear — tinnitus', emoji: '👂', color: '#7fd4e8',
          note: 'Unilateral. Earplugs have been the thing that helps most so far.',
          history: '',
          metrics: [
            { id: 'ear', label: 'Tinnitus loudness', low: 'quiet', high: 'loud', lowerIsBetter: true },
            { id: 'ear-itch', label: 'Ear itchiness', low: 'none', high: 'very itchy', lowerIsBetter: true }
          ],
          flags: [
            { id: 'ear-loud', label: 'Loud place (park, concert, bar)', kind: 'exposure' },
            { id: 'ear-phones', label: 'Headphones on (in-ear or over-ear)', kind: 'exposure' },
            { id: 'ear-plugs', label: 'Ear protection with me', kind: 'protection' }
          ],
          actions: [
            { id: 'ear1', label: 'Earplugs in loud environments', coins: 3, target: 7 },
            { id: 'ear4', label: 'Earplugs packed before heading out', coins: 2, target: 7 },
            { id: 'ear2', label: 'Quiet wind-down before bed', coins: 2, target: 5 },
            { id: 'ear3', label: 'Note episodes + what triggered them', coins: 1, target: 7 }
          ]
        },
        {
          id: 'knee', name: 'Right knee — ACL', emoji: '🦵', color: '#31d0aa',
          note: 'Torn, then healed. Goal: strong enough to trust in sport again.',
          history: '',
          metrics: [
            { id: 'knee', label: 'Knee confidence', low: 'shaky', high: 'solid', lowerIsBetter: false },
            { id: 'knee-crunch', label: 'Knee crunching / grinding', low: 'silent', high: 'loud', lowerIsBetter: true },
            { id: 'ham-sore', label: 'Hamstring soreness', low: 'easy', high: 'sore', lowerIsBetter: true },
            { id: 'ham-tingle', label: 'Tingling down the leg', low: 'none', high: 'constant', lowerIsBetter: true },
            { id: 'knee-swell', label: 'Knee swelling / inflammation', low: 'none', high: 'swollen', lowerIsBetter: true },
            { id: 'foot-arch', label: 'Right foot / arch discomfort', low: 'none', high: 'sore', lowerIsBetter: true }
          ],
          flags: [
            { id: 'knee-walk', label: 'On my feet all day', kind: 'exposure' },
            { id: 'walk-long', label: 'Long walk (half a mile or more)', kind: 'exposure' },
            { id: 'leg-heavy', label: 'Heavy leg day (squats, hills, sprint)', kind: 'exposure' },
            { id: 'ham-curl', label: 'Hamstring curl machine', kind: 'exposure' },
            { id: 'sit-long', label: 'Long sitting on a hard seat', kind: 'exposure' },
            { id: 'ham-stretch', label: 'Deep hamstring stretching', kind: 'exposure' }
          ],
          actions: [
            { id: 'knee5', label: 'Squats (bodyweight or loaded)', coins: 4, target: 3, watch: true },
            { id: 'knee6', label: 'Ice the hamstring after loading', coins: 2, target: 3 },
            { id: 'knee7', label: 'Trained without pushing into pain or tingling', coins: 2, target: 7 },
            { id: 'knee1', label: 'Quad + hamstring strength set', coins: 4, target: 4 },
            { id: 'knee2', label: 'Single-leg balance & control', coins: 3, target: 3 },
            { id: 'knee3', label: 'Mobility / warm-up before activity', coins: 2, target: 5 },
            { id: 'knee4', label: 'Low-impact cardio (bike, swim, walk)', coins: 3, target: 3 }
          ]
        },
        {
          id: 'shoulder', name: 'Shoulder — tightness', emoji: '🫱', color: '#7aa2f7',
          note: 'Still figuring out the cause. Track what loosens it.',
          metrics: [
            { id: 'shoulder', label: 'Shoulder tightness', low: 'loose', high: 'tight', lowerIsBetter: true }
          ],
          flags: [],
          actions: [
            { id: 'sh1', label: 'Shoulder mobility / stretch routine', coins: 3, target: 5 },
            { id: 'sh2', label: 'Posture reset breaks during the day', coins: 1, target: 5 },
            { id: 'sh3', label: 'Rotator cuff + scapular strength', coins: 3, target: 3 }
          ]
        },
        {
          id: 'teeth', name: 'Teeth', emoji: '🦷', color: '#e08bb0',
          note: '',
          metrics: [
            { id: 'teeth', label: 'Mouth comfort', low: 'sore', high: 'great', lowerIsBetter: false }
          ],
          flags: [],
          actions: [
            { id: 'th1', label: 'Brush morning + night', coins: 2, target: 7 },
            { id: 'th2', label: 'Floss', coins: 2, target: 7 },
            { id: 'th3', label: 'Night guard / unclench jaw', coins: 1, target: 7 }
          ]
        },
        {
          id: 'eat', name: 'Eating well', emoji: '🥗', color: '#a3d977',
          note: 'Logging in MyFitnessPal keeps me eating enough, and eating well.',
          history: '',
          metrics: [
            { id: 'eat-energy', label: 'Energy through the day', low: 'flat', high: 'steady', lowerIsBetter: false }
          ],
          flags: [],
          actions: [
            { id: 'eat1', label: 'Logged meals in MyFitnessPal', coins: 2, target: 7, watch: true },
            { id: 'eat2', label: 'Ate enough (hit my calorie goal)', coins: 3, target: 6 },
            { id: 'eat3', label: 'Protein at every meal', coins: 2, target: 5 }
          ]
        }
      ],
      investments: [
        { id: 'i1', name: 'Fresh pair of earplugs', cost: 150, areaId: 'ear', done: false },
        { id: 'i2', name: 'PT or trainer session for the knee', cost: 400, areaId: 'knee', done: false },
        { id: 'i3', name: 'Massage / bodywork for the shoulder', cost: 350, areaId: 'shoulder', done: false },
        { id: 'i4', name: 'Dental visit or night guard', cost: 500, areaId: 'teeth', done: false }
      ],
      log: {},        // 'YYYY-MM-DD' -> { actionId: true }
      metrics: {},    // 'YYYY-MM-DD' -> { metricId: 0..10 }
      flags: {},      // 'YYYY-MM-DD' -> { flagId: true }  (what the day was like)
      applied: [],    // ids of one-time upgrades already folded into this data
      notes: {},      // 'YYYY-MM-DD' -> string
      archive: {},    // actionId -> { coins } for deleted actions, so past coins survive
      spent: 0,
      view: 'today'
    };
  }


  /* ------------------------------------------------------- shape + upgrades */

  /* Data written by an older version is brought forward here rather than being
     thrown away. Upgrades add new habits, ratings and day tags to areas you
     already have — once each, so anything you delete afterwards stays deleted. */

  var UPGRADES = [
    {
      id: 'exposure-tags-and-crunch',
      apply: function (st) {
        var ear = areaById(st, 'ear');
        if (ear) {
          addFlag(ear, { id: 'ear-loud', label: 'Loud place (park, concert, bar)', kind: 'exposure' });
          addFlag(ear, { id: 'ear-plugs', label: 'Ear protection with me', kind: 'protection' });
          addAction(ear, { id: 'ear4', label: 'Earplugs packed before heading out', coins: 2, target: 7 }, 1);
        }
        var knee = areaById(st, 'knee');
        if (knee) {
          addMetric(knee, { id: 'knee-crunch', label: 'Knee crunching / grinding', low: 'silent', high: 'loud', lowerIsBetter: true });
          addAction(knee, { id: 'knee5', label: 'Squats (bodyweight or loaded)', coins: 4, target: 3 }, 0);
          addFlag(knee, { id: 'knee-walk', label: 'On my feet all day', kind: 'exposure' });
        }
      }
    },
    {
      id: 'hamstring-load',
      apply: function (st) {
        var knee = areaById(st, 'knee');
        if (!knee) return;
        addMetric(knee, { id: 'ham-sore', label: 'Hamstring soreness', low: 'easy', high: 'sore', lowerIsBetter: true });
        addFlag(knee, { id: 'leg-heavy', label: 'Heavy leg day (squats, hills, sprint)', kind: 'exposure' });
        addAction(knee, { id: 'knee6', label: 'Ice the hamstring after loading', coins: 2, target: 3 }, 1);
      }
    },
    {
      id: 'curl-machine-tag',
      apply: function (st) {
        var knee = areaById(st, 'knee');
        if (!knee) return;
        addFlag(knee, { id: 'ham-curl', label: 'Hamstring curl machine', kind: 'exposure' });
      }
    },
    {
      id: 'nerve-and-sitting',
      apply: function (st) {
        var knee = areaById(st, 'knee');
        if (!knee) return;
        addMetric(knee, { id: 'ham-tingle', label: 'Tingling down the leg', low: 'none', high: 'constant', lowerIsBetter: true });
        addFlag(knee, { id: 'sit-long', label: 'Long sitting on a hard seat', kind: 'exposure' });
        addFlag(knee, { id: 'ham-stretch', label: 'Deep hamstring stretching', kind: 'exposure' });
        addAction(knee, { id: 'knee7', label: 'Trained without pushing into pain or tingling', coins: 2, target: 7 });
      }
    },
    {
      // squatting seems to help the knee, and MyFitnessPal keeps eating on
      // track — both are now compared against how the days went
      id: 'squats-help-and-eating',
      apply: function (st) {
        var knee = areaById(st, 'knee');
        if (knee) knee.actions.forEach(function (a) { if (a.id === 'knee5') a.watch = true; });
        if (!areaById(st, 'eat')) {
          st.areas.push({
            id: 'eat', name: 'Eating well', emoji: '🥗', color: '#a3d977',
            note: 'Logging in MyFitnessPal keeps me eating enough, and eating well.',
            history: '',
            metrics: [
              { id: 'eat-energy', label: 'Energy through the day', low: 'flat', high: 'steady', lowerIsBetter: false }
            ],
            flags: [],
            actions: [
              { id: 'eat1', label: 'Logged meals in MyFitnessPal', coins: 2, target: 7, watch: true },
              { id: 'eat2', label: 'Ate enough (hit my calorie goal)', coins: 3, target: 6 },
              { id: 'eat3', label: 'Protein at every meal', coins: 2, target: 5 }
            ]
          });
        }
      }
    },
    {
      id: 'ear-headphones-and-ent',
      apply: function (st) {
        var ear = areaById(st, 'ear');
        if (!ear) return;
        if (ear.name === 'Ear — pulsatile tinnitus') ear.name = 'Ear — tinnitus';
        addMetric(ear, { id: 'ear-itch', label: 'Ear itchiness', low: 'none', high: 'very itchy', lowerIsBetter: true });
        addFlag(ear, { id: 'ear-phones', label: 'Headphones on (in-ear or over-ear)', kind: 'exposure' });
      }
    },
    {
      id: 'knee-history-and-walking',
      apply: function (st) {
        var knee = areaById(st, 'knee');
        if (!knee) return;
        addMetric(knee, { id: 'knee-swell', label: 'Knee swelling / inflammation', low: 'none', high: 'swollen', lowerIsBetter: true });
        addMetric(knee, { id: 'foot-arch', label: 'Right foot / arch discomfort', low: 'none', high: 'sore', lowerIsBetter: true });
        addFlag(knee, { id: 'walk-long', label: 'Long walk (half a mile or more)', kind: 'exposure' });
      }
    }
  ];

  function areaById(st, id) {
    return st.areas.filter(function (a) { return a.id === id; })[0];
  }
  function hasId(list, id) {
    return list.some(function (x) { return x.id === id; });
  }
  function addFlag(area, flag) { if (!hasId(area.flags, flag.id)) area.flags.push(flag); }
  function addMetric(area, m) { if (!hasId(area.metrics, m.id)) area.metrics.push(m); }
  function addAction(area, act, at) {
    if (hasId(area.actions, act.id)) return;
    area.actions.splice(typeof at === 'number' ? at : area.actions.length, 0, act);
  }

  function migrate(st) {
    if (!st.flags) st.flags = {};
    if (!st.applied) st.applied = [];
    if (!st.archive) st.archive = {};

    (st.areas || []).forEach(function (a) {
      // one rating per area became a list of them; the first keeps the area's
      // id as its key so every rating recorded so far still lines up
      if (!a.metrics) {
        a.metrics = (a.metric && a.metric.label)
          ? [{ id: a.id, label: a.metric.label, low: a.metric.low, high: a.metric.high, lowerIsBetter: !!a.metric.lowerIsBetter }]
          : [];
      }
      delete a.metric;
      if (!a.flags) a.flags = [];
      if (!a.todos) a.todos = [];
      if (typeof a.history !== 'string') a.history = '';
    });

    UPGRADES.forEach(function (u) {
      if (st.applied.indexOf(u.id) >= 0) return;
      try { u.apply(st); } catch (e) { /* an upgrade must never cost you your data */ }
      st.applied.push(u.id);
    });
    return st;
  }

  /* ------------------------------------------------------- sealed history */

  /* Background text too personal for a public file ships encrypted. The
     password is asked for once per device; the key it unlocks is kept in
     local storage, so it is not asked again. Once unlocked, the text lives
     in your own data like anything you typed. */

  var SEAL_KEY = 'growth-rings-unlock';
  var SEALED = {
    salt: 'cg5+21Vpz5F/I8wHrS+LFQ==', iter: 600000,
    items: [
      {'id': 'sealed-ear-ent', 'area': 'ear', 'iv': 'OeS6bagNcS5WtVPp', 'ct': 'ftGeloXy66pCDz4o+2n+lorhZ/K1n0fPu9rJx+E3UTxeY86O/vk4Nd+KfdmFfqPj3l9Y6H/x7voRpUljwcQbApaXtl4W+DP88s66oymPSjegclg/t0GdPJxBas+vt0w7JoDFfbyRhjpiXk+1zejA3e8ojVTpvwPQWDgJWTsGQdLdPLM5S1QHY16InTMcEaUf5NGH1VwHEwNut/x8p8+7bSipNPBQLQPOkLatkwEWi0GWTpzKRp7RCAEm0hhmdB3j7A9mldaWuHR8Q+Wwn+UxRnE8gnCvO28yqkPbd0DqALzFhEpffYvFDkb23veUKPIsGrY11GSgbb6xaQyFwx4Sq0/Go1KOFJvzi1PHhgmfQmnEwPfzIuUhsOvlYOIjeRvzPMTtgxDkbNICRBtIQxkc2/MP4HLconzTdaUkg1WR9sYER+mJ4XwavVGBlcUdgsFXodiBVyswqtXY75HnNmB+oSR8aYe00wTEHbZQH6S026HJLWAoDcwaDhQiwxuIhWg4SbnIiwlUQjuTQgNoe+5u/XqGqI3z74f8WP/OkBhqCX0UHdP1Nwonzp6H2z51HOKlfHG3+qiB7AHPO9IVemCu'},
      {'id': 'sealed-knee-history', 'area': 'knee', 'replaces': 'd5c78335', 'iv': 'cqn1zH1n92f5SiqO', 'ct': 'fVlkySfQIsSsmAFT/lL4xsHfmQFnaZFnh2XeTTnQ4loNFnwLMjJu8Di0KEVsfU06tqPs0zYxM/Ind4YAfJETSKLRXJICzdP3HwCP6wvdsXOkCe6ATu1gd05FmohQ/STBZx4TrAs2qHI6qrKNLwsb1ZDgBBeEhjGWRaPNzQ4afQr9HHTQEaLHLwqiZ1LIovelyuAfgWpSI+0n7cv7T5plvJMVv3ddD/zAaiCDWufgCcxHQkp4AmtL5R/Zzbt3Txp5XPGE3e4pjFLB2cTNTbTNhPfS27dCBDIapXMWDvhuFhMA49ZsTQpQFZL8odP4ibY5jyzAD7ppdPth5ljnEmF341A4pKAvb7yYk4pWn02iRECnuewudxINRVM3Xh4CBB8EK9V0d/823tlih6QTZFGzIqqre3uZuc8cnW2+IVGjLXU8H8uCyu3IhXp8t0h5s5r6OChDQZso8C3bnB7Te/phb2yZrYJsQh2aKyDrZnZa7ZoyLsWde0FkYPBEC5MJnbvlIjH8Q5hgxnMzz1oyYNAwJXNvL3kOmFw21H5N5SbixfU8LhXuQDTotedPckv4flULMmjXhPf0wGk5gxBnOb/olGeohhReQhacD7/+xKbMgOY1QIMay61RqRvV1NFGZ0pVAji4BV7Hby9DVF3rxkzMuUhOBCHH8epsYPdFF1JTc4E+IW2bqzXLRdrKOSjgvRgR8nYpuolMqVTh9llsivqdCZySxQurT0OcLYtBVeDNUmFE37fTU8eRHvb3BUEbNplHeuoILcwO2S0pO3kym5poi2E4Hvvo6OczBwBsdH93C6GkyvG9o4xhfBtgA06I89Mpgce/fmCOJ1UTlBvVqc6Dz646CBi7cbcp161ZPPr9MZeLfCo1thuKQOpZBAntjU3B6kxktNjAcKlAH63u1wusz7EOZgxv2qf5Am62Pk8bWbOh7Vg09dW2OB42ftWupAevL7UEnznVYG869T7MU/Hk1jkpG8HRAyoxfWbX1KzCx/88Rh3hvt7gyzCpTsY96/S8cj41aiGUFOwmuBxfwtcR9RqxNoz+QK+xRf5PpmGC/4fFIUEdwd6uleUF7rBnyNVT09cwW3MWBgftv7UOOmmqRAeXeUZJHQ7fAxcn8rAJvih6jP+kXpq0w8XX0DYDxTWF99zug4dFqbQyt0aT1q0L3M6QYRcdebTiLB75yi5Fw9huVZl3ElQH1r8L85H6BemKI+KUjQ1pXFdkCw0KM1i0WWMIZPx/1olrB/mU1duImunMFdUprqiRsukOvp9pAnwhKmuD6woZPGxwrF/p4F3sxCo/kQp79gTXnmzmDEeLjVUUhHgsroBmhKrnAfZMqz8Zk+TUbHyh7/n1GeqK02lE1w9KE18dl5YM6KNZCNfMHk2eZJB2lvNl2Qk5Cq0NtAmi4o0YCm1N+gTRONW+jLFjF60n4tnH9DsvnUGZPnYjjCXrQlOFGKrVuUV3gC+1X5F+z13Ye4Mcig8HVb5gG2eQzCoQwwxooO+gQi+GHJyudtyX9h0UMAvJfsZ4T32cnaATrplJ7YEL3oxHXEod33o+l6yeSE5vyEMPZenGBDuXdDEAQkiN1F3GRbvF5mCf1j9eu3fK1fDXyG1SrfQ1BxrnszXwmUq0DIsY09kYtSzRqMzOC46wofUuWxJOhNOip9tjYx2hLXKGJyavF/c1jxx4dL0GfkZ3GGw2LHxYmfIsMMBO2Yg0erDSb3dK6/s/2gqf7LfbovxRT6F4wOPmDNf1jSjNpysblURIxtV0o6M8xEWm43pqFesYw4bdTLYcWNRUP5wis9aQ3cNRTCFXTCaS8Fzbd8+WvEf0npMyOny7YS9zbBAWBm+kiXW481UrRfUrFHkkG6+9HFeIXfDEXxEUDqAfD7gvqozXRjD6cvQz3J7Z3eeErdmwDh8PX7/2K0C4MEkJ8vXGrSuvQ5AjplIcy9M8lrwjNH3IAgsNq0u5O5YS1W/CdIPZAPoxfE2r85e5G4YlWlCmN4GzOkKslZPQCFO+LMmkSVQ6FQuiKWLEQG7EW/ZC6l+KFFGScJVNC0+MNBzuD7Vu8/bhHd0mgdqO/hZ4rp8xq1e32JVRuvZEcokxwKVjxirVs897XbfpHyAihOMcRYDXBYyhUfPKrK4SkaQEf0aS2BRBnXEVkl+p1OAyelw+V1pnifRc'},
      {'id': 'sealed-teeth-tooth', 'kind': 'json', 'iv': 'aAZWrUUDtmqvDCjU', 'ct': 'IM23RGSxu2BlyTHj3WYzTprddtrGAeZCHCDZnWQd2tQOSraYPZBuWaicRXtuUgm+HPcXeUNCNxIPnWcUP2DupDJ5euEDziATCO68CDFsQQweOV2GrZ2AHkUZnOShVpmqB4iu/II20S+/ykXY67XP6rcMSLUO/ZGHRo+fQVnC+6E+n6hK/39K7Eo5YrluVsvIwzOaeIz7X2Xm19fS1K/dojr10NDH0lYAfBoLY8kJDJhPHkp0bxe5f5QIOSROWJlA7FacdW4u7jONQaLErWmtMKxPVIQdRwLOwd8WVhzmLiQfjbmRNyMr9vYMRSu0HkHZ0aF/1ioGje8h2mRfR2Hy+GnvWu5Kz4h+jjcXhQCFjXsOcAOHUFmI47nnG9aWHJLL/PICPE2Imvjuuz4s6N/c685LUfBzLBfNK4zR3h+q1SDUziAObz6Tu5sjTItkm3u8p3IhW80Hd0pXiWEPzVSR1od3d0M7FRR2J+uhQsR10EGz2mxIqLMMQa0t3DC5QQlu9Fo9pWxZrIzNoicLlNu2eFOgewyInuz4vvzJGkrJHkEdikj+QaDXpDeo48je5jPAkGtoAKw0doGhjFLHw7PsYEga92W5XiMOxkD7HapS5VQWJOFgbBzAZ+uMWfrXi+y/3LbgUrf6KNBh4ywBxklQc7E0wYgTQvM0c/WKTQ=='},
      {'id': 'sealed-eyes', 'kind': 'json', 'iv': 'uK+HjW8+q6PFYRRc', 'ct': '0ojV4M9ZLtcnQhnrcJ/58S2VW9yXsPP/WnQaePnzuQ3ocvgWSEdrFcHpUdwT3uYqEUbheIi78k3kpYq3aH0dsLcukq0li3KDaoI6WxdfpmDo8s5jIOQfL/W6842s5OEKbNZGPooouJN8JrK3jI9Yrg38fkXiMbXNN8yvXHkjhiQShhMMF1gXyhNSMWiV29wBNDZ9iN6cvi/xk1IN4pGeWRu5j2aHjqZADPQeVHGKGyTDhZ1vUXwGK3fpr5IjHd2chcLIGJGpKXQn9vbLGmYdyxu33gqmKGFh9odY5TmFIAMPI3ym3HSjhZmvSioPi+tEMzsNxtXDnAo3biWySH2WvTMCJg0l82Ip43cheVWmnD1l37RmFQTJ5hkP5worTxsHKkoGV4IWhmpDHc5b8CGCPFPSUHKAUhw7HwN7950ydqNHK7MveCsjz7z2plK2Gw7s'},
      {'id': 'sealed-elbow', 'kind': 'json', 'iv': 'LWi03f824xzMmTpQ', 'ct': '+0dbv5VFhnXIZMl46j6A3ZA/jY6jW3Qeu0b3xxuzWapFmMY5MdItGJW2OUe2ExlOgFJxyRK5MFcc+DQKXjGspQmKrYsplsSgepzZfemQSj9sLRzHHjDEYx4mB5E/8Fr5Z57OD9r6ZhcRivN1dlfhwWLKcBs1y4pJwsHrvQep/3dRu6FQCei2fssDMd1sCF6WxhX8ImAWmeTZai7AQ1pnnb5KhU14cC0wTL4J85q74J99JU0yJO10QisakU/gMmT9xj4PzQUw7askJr91GPHZc5P5hTYT1UkGpnUm67RtAd1BFh6MnJI8ZTFItvAvtPxHq8fvfgysf8pvNGS3gd1bj//Auhdsm6tE0cGzpovAtK+QXGW0QGvxp0WNWqp8onuTUJ9PKdvv1XU4beOrwn35wUGQbIMEhGWfVQelrE1Qt4VQN15xL/sg3GI0m89I6a1bGQ/JsUhsSY8n/2ZZH6UkoD8vnRaWcOXe2jTRx/e9GEM8dM8psLVjiB2Mh2cgDpHDryfxSyZATzh/QyQcGN9O1BjzN2wlk3r0768no3Equaph4ZI+xXpkfOnnz1I47DGmNbUYU9u/5zMPtqp4ziqgNkxy95I8t6snnaNrXyn1h5mxCew='},
      {'id': 'sealed-skin', 'kind': 'json', 'iv': 'lMJJXbm4MBfpmVR2', 'ct': 'PmsRc4CBFkjFvek2Zi90FPfFfMlphLBP8p71p+szUCPzOHkiFF83GYsM3Yf/+z6YgYKHeSjHyPxLA3waZKz0nU73zmDEV9ybvCjuF6WNbYUIVL2rgrvovkhCK6yjG+DUvLUl22NqnnAnQhCgUxYvN4sGvm80nSKHwmBLaVn6nUAFQnVf4unLlYvUlIbV561SKICUdhmqDAST3AMLO4MQkWDnyIP3K+HbV2Xk2+jGfsCoCXMmzdgioDFJlhoVn7w2C/UwvypLlioizimYEYAXHILFQgiRRNh5z+yqIrOv1earSdisJMOPjIPCkNbdPUU9A0glg2nFJyYeY3gOrPm+Wy+5eu+TG9LfWCAG+YTcmumfjsatS/RvYZkRmikhiWfxS2Juxg8dKfFUkk77b30agwcPGHBS1LOre8ULS0GIzTHNQg8iD+4D1U3H+Z8djGxhfYBN0LPomLz/QgWPg35Sf+TU6ne5O9doCoQ1+sDcZyczhPD1RL3I5bt+W29ljY5INBjLFPAeefd/ROdnJnBQh8otrcpp1t/P4TxTdzUzcGjxd9yJ4WBfoq3362TspMfZsMhPByMjM7ix2d1NZ0f2QX6EzEyv7fzzBgA+P8r0IvD41cSwb/NO87uhhk16s4lT'},
      {'id': 'sealed-personal', 'kind': 'json', 'iv': '4Fltq866hv+9xLpn', 'ct': 'y/w9emFWu4h9qcHNzUhwfv7GDF3pMboIwlHnPVbnYBVplJrUEKMrl/n2OguxsiztAs/8arkdEt8hgVNlf5ZU6JFNaAwEqySnMQUOyVtaqCtxMUPfiDUB2dSk4Qbi2x+ho6fNXqFEQdGJcHu7RL20h7ic3AiFljd6VTwLcvPTHq7hk0sfdeM2b09RqOXA+yzl2cYKnBac65Y6NSQHzqC2F0ZIugIfLWWPuBJHM6Sv2d2ExP9GlKr+I/jbkZrh8oEmvO0Zncu01/cvRaFwl+iqfVU49lSDefyCONcaR855sxXMX5jEag+4If91IFIvhy0uN7lKbi/wNeyZrhupBEY7bwl8eNh95BmPTes25rsQDSchI+1gIWMYhCxir7UgHS80J0Fh7bPheO2b4xQbfMRdEvjfYzs/501z0CCwKUDx+Iq0cjIso2THK7pTawJXUmNw9XSijGdsXfIJaYekIZTeQOW/oXukJRvPQjo9FUFpZhmlYhnlcqcsD64BMFF3dJEEWvX0G/Z/lfwBWiNnLZcVkEpScsFxBxPZ3k7s'}
    ]
  };
  var unsealing = false;

  function fnv(t) {
    var h = 0x811c9dc5;
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(16);
  }
  function unb64(str) {
    var bin = atob(str), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function tob64(buf) {
    var u = new Uint8Array(buf), bin = '';
    for (var i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
    return btoa(bin);
  }
  function sealedPending() {
    return SEALED.items.filter(function (it) {
      return S.applied.indexOf(it.id) < 0 && (it.kind === 'json' || areaById(S, it.area));
    });
  }
  function storedSealKey() {
    try { return localStorage.getItem(SEAL_KEY); } catch (e) { return null; }
  }

  function keyFromPassword(pw) {
    var subtle = window.crypto.subtle;
    return subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return subtle.deriveKey({ name: 'PBKDF2', salt: unb64(SEALED.salt), iterations: SEALED.iter, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
    });
  }

  // decrypts everything still pending; rejects if the key is wrong
  function unseal(key) {
    var pending = sealedPending();
    return Promise.all(pending.map(function (it) {
      return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(it.iv) }, key, unb64(it.ct))
        .then(function (buf) { return new TextDecoder().decode(buf); });
    })).then(function (texts) {
      pending.forEach(function (it, i) {
        if (it.kind === 'json') applySealedJson(it, JSON.parse(texts[i]));
        else addHistory(areaById(S, it.area), texts[i], it.replaces);
        S.applied.push(it.id);
      });
      if (pending.length) { save(); render(); }
    });
  }

  // an untouched earlier default is replaced; anything you wrote is kept
  function addHistory(area, text, replaces) {
    if (!area || !text) return;
    var h = area.history || '';
    if (!h.trim() || (replaces && fnv(h) === replaces)) area.history = text;
    else if (h.indexOf(text) < 0) area.history = h + '\n\n' + text;
  }

  /* A sealed JSON item can add a whole profile, or add history, ratings and
     to-dos to one you already have. A profile you deleted stays deleted. */
  function applySealedJson(it, d) {
    var area = areaById(S, d.area);
    if (!area && d.addArea) {
      area = {
        id: d.area, name: d.addArea.name, emoji: d.addArea.emoji, color: d.addArea.color,
        note: d.addArea.note || '', history: '', discreet: !!d.addArea.discreet,
        metrics: [], flags: [], actions: [], todos: []
      };
      S.areas.push(area);
    }
    if (!area) return;
    addHistory(area, d.history);
    (d.metrics || []).forEach(function (m) { addMetric(area, m); });
    (d.flags || []).forEach(function (f) { addFlag(area, f); });
    (d.todos || []).forEach(function (label, i) {
      var id = it.id + '-' + i;
      if (!hasId(area.todos, id)) area.todos.push({ id: id, label: label, done: false });
    });
  }

  function unlockWithPassword(pw) {
    return keyFromPassword(pw).then(function (key) {
      return unseal(key).then(function () { return window.crypto.subtle.exportKey('raw', key); });
    }).then(function (raw) {
      try { localStorage.setItem(SEAL_KEY, tob64(raw)); } catch (e) { /* asked again next time */ }
    });
  }

  // called on every render: a device that already unlocked never asks again
  function autoUnseal() {
    var raw = storedSealKey();
    if (unsealing || !raw || !sealedPending().length || !(window.crypto && window.crypto.subtle)) return;
    unsealing = true;
    window.crypto.subtle.importKey('raw', unb64(raw), 'AES-GCM', false, ['decrypt'])
      .then(unseal)
      .catch(function () { try { localStorage.removeItem(SEAL_KEY); } catch (e) { /* ignore */ } })
      .then(function () { unsealing = false; });
  }

  function unlockCard() {
    var card = el(
      '<div class="card"><div class="card-head"><div><h2>Unlock your history</h2>' +
      '<p class="sub">Some of your profiles are stored encrypted. Enter the password once on this device.</p>' +
      '</div></div>' +
      '<form class="unlock"><input type="password" class="u-pw" autocomplete="current-password" placeholder="password">' +
      ' <button type="submit" class="btn primary">Unlock</button> <span class="muted u-msg"></span></form></div>'
    );
    var form = card.querySelector('form'), msg = card.querySelector('.u-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = card.querySelector('.u-pw').value;
      if (!pw) return;
      msg.textContent = 'Unlocking…';
      unlockWithPassword(pw).catch(function () { msg.textContent = 'That password didn’t work.'; });
    });
    return card;
  }

  /* ------------------------------------------------------------------- state */

  var S = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return migrate(seed());
      var parsed = JSON.parse(raw);
      var base = seed();
      Object.keys(base).forEach(function (k) { if (!(k in parsed)) parsed[k] = base[k]; });
      return migrate(parsed);
    } catch (e) {
      return migrate(seed());
    }
  }

  function save() {
    S.updatedAt = Date.now();
    saveLocal();
    scheduleCloud();
  }

  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: run in memory */ }
  }

  function anchorSave(name, text) {
    var type = /\.json$/.test(name) ? 'application/json' : 'text/plain';
    var blob = new Blob([text], { type: type });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function uid() { return Math.random().toString(36).slice(2, 9); }

  /* ------------------------------------------------------------------- dates */

  function keyOf(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function today() { return keyOf(new Date()); }
  function shift(days) { var d = new Date(); d.setDate(d.getDate() + days); return keyOf(d); }
  function lastDays(n, offset) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) out.push(shift(-(i + (offset || 0))));
    return out;
  }
  function weekdayShort(k) {
    var p = k.split('-');
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
  }

  /* ----------------------------------------------------------------- lookups */

  function allActions() {
    return S.areas.reduce(function (acc, a) {
      return acc.concat(a.actions.map(function (x) { return { area: a, action: x }; }));
    }, []);
  }
  function coinsFor(actionId) {
    var hit = allActions().filter(function (p) { return p.action.id === actionId; })[0];
    if (hit) return hit.action.coins;
    return S.archive[actionId] ? S.archive[actionId].coins : 0;
  }
  function isDone(dayKey, actionId) { return !!(S.log[dayKey] && S.log[dayKey][actionId]); }
  function flagOn(dayKey, flagId) { return !!(S.flags[dayKey] && S.flags[dayKey][flagId]); }
  function toggleFlag(dayKey, flagId) {
    if (!S.flags[dayKey]) S.flags[dayKey] = {};
    if (S.flags[dayKey][flagId]) delete S.flags[dayKey][flagId];
    else S.flags[dayKey][flagId] = true;
    save();
    return flagOn(dayKey, flagId);
  }
  function hits(actionId, days) {
    return days.filter(function (d) { return isDone(d, actionId); }).length;
  }

  /* ----------------------------------------------------------------- scoring */

  // Rings are a rolling 7-day adherence score: for each habit, how much of its
  // weekly target you actually hit. Weighted by how much a habit is worth, so a
  // heavy habit moves the ring more than a light one.
  function areaScore(area, days) {
    var num = 0, den = 0;
    area.actions.forEach(function (act) {
      var target = Math.max(1, act.target || 1);
      var weight = target * Math.max(1, act.coins || 1);
      num += Math.min(hits(act.id, days), target) / target * weight;
      den += weight;
    });
    if (!den && area.todos.length) {
      return area.todos.filter(function (td) { return td.done; }).length / area.todos.length;
    }
    return den ? num / den : 0;
  }
  function week() { return lastDays(7); }
  function prevWeek() { return lastDays(7, 7); }

  function overallScore(days) {
    var live = S.areas.filter(function (a) { return a.actions.length; });
    if (!live.length) return 0;
    var s = 0;
    live.forEach(function (a) { s += areaScore(a, days); });
    return s / live.length;
  }

  // A single day's completion: coins earned that day against a fair daily share.
  function dayCompletion(dayKey) {
    var earned = 0, expected = 0;
    allActions().forEach(function (p) {
      var act = p.action;
      expected += (Math.max(1, act.coins || 1) * Math.max(1, act.target || 1)) / 7;
      if (isDone(dayKey, act.id)) earned += Math.max(1, act.coins || 1);
    });
    return expected ? Math.min(1.2, earned / expected) : 0;
  }

  var TODO_COINS = 5;
  function todosDoneOn(dayKey) {
    var n = 0;
    S.areas.forEach(function (a) { a.todos.forEach(function (td) { if (td.done && td.doneAt === dayKey) n++; }); });
    return n;
  }

  function coinsEarned() {
    var total = 0;
    S.areas.forEach(function (a) { a.todos.forEach(function (td) { if (td.done) total += TODO_COINS; }); });
    Object.keys(S.log).forEach(function (day) {
      Object.keys(S.log[day]).forEach(function (aid) {
        if (S.log[day][aid]) total += coinsFor(aid);
      });
    });
    return total;
  }
  function coinsToday() {
    var t = today(), sum = 0;
    Object.keys(S.log[t] || {}).forEach(function (aid) { if (S.log[t][aid]) sum += coinsFor(aid); });
    return sum + todosDoneOn(t) * TODO_COINS;
  }
  function balance() { return Math.max(0, coinsEarned() - (S.spent || 0)); }

  function streak() {
    var n = 0, i = 0;
    if (!Object.keys(S.log[today()] || {}).length) i = 1; // today still open — don't break it
    for (; i < 400; i++) {
      var k = shift(-i);
      var any = Object.keys(S.log[k] || {}).some(function (a) { return S.log[k][a]; });
      if (any) n++; else break;
    }
    return n;
  }

  // average of a rating across every day that matches a test, with the sample
  // size, so a comparison can say how much it is standing on
  function ratingAvg(metricId, pred) {
    var vals = [];
    Object.keys(S.metrics).forEach(function (d) {
      var v = S.metrics[d][metricId];
      if (typeof v === 'number' && pred(d)) vals.push(v);
    });
    if (!vals.length) return null;
    var sum = vals.reduce(function (a, b) { return a + b; }, 0);
    return { avg: sum / vals.length, n: vals.length };
  }

  /* "the most pain it has been in a while" deserves an actual number: how far
     back you have to go to find a day that was this bad (or this good). Only
     speaks up once there is enough history behind it to mean something. */
  function standoutNote(metric, value) {
    var rated = 0, asBadAt = 0, asGoodAt = 0, oldest = 0;
    for (var i = 1; i <= 180; i++) {
      var v = (S.metrics[shift(-i)] || {})[metric.id];
      if (typeof v !== 'number') continue;
      rated++; oldest = i;
      if (!asBadAt && (metric.lowerIsBetter ? v >= value : v <= value)) asBadAt = i;
      if (!asGoodAt && (metric.lowerIsBetter ? v <= value : v >= value)) asGoodAt = i;
      if (asBadAt && asGoodAt) break;
    }
    if (rated < 6) return null;
    var worstSpan = asBadAt || oldest;
    var bestSpan = asGoodAt || oldest;
    if (worstSpan >= 7 && worstSpan >= bestSpan) return { text: 'worst in ' + worstSpan + ' days', cls: 'bad' };
    if (bestSpan >= 7) return { text: 'best in ' + bestSpan + ' days', cls: 'good' };
    return null;
  }

  /* Days you tagged against days you didn't — the question behind the tags is
     "does this kind of day cost me?". Uses all history, not just a fortnight,
     and a tag you have never used has nothing to say yet. */
  function computePatterns() {
    var out = [];
    S.areas.forEach(function (area) {
      var exposures = area.flags.filter(function (f) { return f.kind === 'exposure'; });
      var guards = area.flags.filter(function (f) { return f.kind === 'protection'; });

      area.metrics.forEach(function (m) {
        if (!m.label) return;
        exposures.forEach(function (f) {
          out.push({
            area: area, metric: m, name: f.label,
            on: ratingAvg(m.id, function (d) { return flagOn(d, f.id); }),
            off: ratingAvg(m.id, function (d) { return !flagOn(d, f.id); }),
            onWord: 'on those days', offWord: 'otherwise'
          });
          // and, on those days specifically, did the protection help?
          guards.forEach(function (g) {
            out.push({
              area: area, metric: m, name: g.label + ' · ' + f.label.toLowerCase(),
              on: ratingAvg(m.id, function (d) { return flagOn(d, f.id) && flagOn(d, g.id); }),
              off: ratingAvg(m.id, function (d) { return flagOn(d, f.id) && !flagOn(d, g.id); }),
              onWord: 'with', offWord: 'without'
            });
          });
        });
        // habits you suspect are doing something: ratings on days you did them
        area.actions.filter(function (a) { return a.watch; }).forEach(function (act) {
          out.push({
            area: area, metric: m, name: act.label,
            on: ratingAvg(m.id, function (d) { return isDone(d, act.id); }),
            off: ratingAvg(m.id, function (d) { return !isDone(d, act.id); }),
            onWord: 'on days you did it', offWord: 'otherwise'
          });
        });
      });
    });
    return out.filter(function (p) { return p.on && p.on.n > 0; });
  }

  function patternLine(p) {
    if (!(p.on && p.off && p.on.n >= 2 && p.off.n >= 2)) {
      return { enough: false, desc: p.metric.label.toLowerCase() + ' · needs a few more rated days (' +
        (p.on ? p.on.n : 0) + ' / ' + (p.off ? p.off.n : 0) + ')', label: '—', cls: 'flat' };
    }
    var diff = p.on.avg - p.off.avg;
    var better = p.metric.lowerIsBetter ? diff < 0 : diff > 0;
    return {
      enough: true,
      desc: p.metric.label.toLowerCase() + ' ' + p.on.avg.toFixed(1) + ' ' + p.onWord +
        ' (' + p.on.n + ' days) vs ' + p.off.avg.toFixed(1) + ' ' + p.offWord + ' (' + p.off.n + ')',
      label: (diff > 0 ? '+' : '') + diff.toFixed(1),
      cls: Math.abs(diff) < 0.4 ? 'flat' : (better ? 'up' : 'down')
    };
  }

  function metricAvg(areaId, days) {
    var vals = days.map(function (d) { return S.metrics[d] && S.metrics[d][areaId]; })
      .filter(function (v) { return typeof v === 'number'; });
    if (!vals.length) return null;
    return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  }

  /* --------------------------------------------------------------- rendering */

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shortName(name) {
    return String(name).split(' — ')[0].split(' - ')[0].trim() || name;
  }

  function pct(x) { return Math.round(x * 100); }

  function ring(value, size, stroke, color) {
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var v = Math.max(0, Math.min(1, value));
    return '<div class="ring-wrap" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle class="ring-track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="ring-bar" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '"' +
      ' stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '"' +
      ' stroke-dashoffset="' + (c * (1 - v)).toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '</svg>' +
      '<div class="ring-label"><div class="pct' + (size < 90 ? ' sm' : '') + '">' + pct(value) + '<span style="font-size:.6em">%</span></div></div>' +
      '</div>';
  }

  function sparkline(values, color, lowerIsBetter) {
    var w = 120, h = 26;
    var pts = values.map(function (v, i) {
      var x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
      var y = h - (v / 10) * (h - 4) - 2;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="' + (lowerIsBetter ? .85 : .85) + '"/></svg>';
  }

  /* ---------------------------------------------------------------- navigation */

  /* Views are addressed by name: 'today', 'coins', or 'area:<id>'. Profiles are
     the centre of the app — everything about one part of you in one place. */

  function go(view) {
    S.view = view;
    save();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function currentArea() {
    if (String(S.view).indexOf('area:') !== 0) return null;
    return S.areas.filter(function (a) { return a.id === S.view.slice(5); })[0] || null;
  }

  function renderNav() {
    var nav = document.getElementById('nav');
    nav.innerHTML = '';
    var tabs = [{ view: 'today', label: 'Today' }];
    S.areas.forEach(function (a) {
      tabs.push({ view: 'area:' + a.id, label: a.emoji + ' ' + shortName(a.name) });
    });
    tabs.push({ view: 'coins', label: '◎ Coins' });

    tabs.forEach(function (t) {
      var b = el('<button class="tab' + (S.view === t.view ? ' is-active' : '') + '" type="button">' + esc(t.label) + '</button>');
      b.addEventListener('click', function () { go(t.view); });
      nav.appendChild(b);
    });
  }

  /* ------------------------------------------------------------ shared pieces */

  /* The daily check-in for one area: what you did, what the day was like, how it
     felt. Used on Today and again on the area's own profile. */
  function logBlock(area, opts) {
    var t = today(), days = week();
    var wrap = el('<div></div>');

    var list = el('<ul class="actions"></ul>');
    area.actions.forEach(function (act) {
      var done = isDone(t, act.id);
      var li = el('<li></li>');
      var btn = el(
        '<button class="act' + (done ? ' done' : '') + '" type="button">' +
        '<span class="box">✓</span>' +
        '<span class="act-label">' + esc(act.label) + '</span>' +
        '<span class="act-meta">' + hits(act.id, days) + '/' + act.target + ' wk · <b>◎' + act.coins + '</b></span>' +
        '</button>'
      );
      btn.addEventListener('click', function () { toggle(t, act.id); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    if (!area.actions.length && !opts.quiet) {
      list.appendChild(el('<li><p class="empty">No habits here yet — add one in Setup.</p></li>'));
    }
    wrap.appendChild(list);

    if (area.flags.length) {
      var chips = el('<div class="flags"></div>');
      area.flags.forEach(function (flag) {
        var on = flagOn(t, flag.id);
        var chip = el('<button class="flag' + (on ? ' on' : '') + '" type="button">' + esc(flag.label) + '</button>');
        if (on) chip.style.borderColor = area.color;
        chip.addEventListener('click', function () {
          var nowOn = toggleFlag(t, flag.id);
          chip.classList.toggle('on', nowOn);
          chip.style.borderColor = nowOn ? area.color : '';
        });
        chips.appendChild(chip);
      });
      wrap.appendChild(chips);
    }

    area.metrics.forEach(function (metric) {
      if (!metric.label) return;
      var cur = (S.metrics[t] || {})[metric.id];
      var m = el(
        '<div class="metric">' +
        '<div class="metric-head"><span>' + esc(metric.label) + ' today</span>' +
        '<b>' + (typeof cur === 'number' ? cur + '/10' : 'not set') + '</b></div>' +
        '<input type="range" min="0" max="10" step="1" value="' + (typeof cur === 'number' ? cur : 5) + '">' +
        '<div class="metric-head" style="margin:4px 0 0"><span>' + esc(metric.low || '0') + '</span><span>' + esc(metric.high || '10') + '</span></div>' +
        '</div>'
      );
      var noteEl = el('<div class="metric-note"></div>');
      m.appendChild(noteEl);
      var refreshNote = function () {
        var val = (S.metrics[t] || {})[metric.id];
        var n = (typeof val === 'number') ? standoutNote(metric, val) : null;
        noteEl.textContent = n ? n.text : '';
        noteEl.className = 'metric-note' + (n ? ' ' + n.cls : '');
      };
      refreshNote();
      m.querySelector('input').addEventListener('input', function (e) {
        if (!S.metrics[t]) S.metrics[t] = {};
        S.metrics[t][metric.id] = +e.target.value;
        m.querySelector('.metric-head b').textContent = e.target.value + '/10';
        refreshNote();
        save();
      });
      wrap.appendChild(m);
    });

    return wrap;
  }

  function toggle(dayKey, actionId) {
    if (!S.log[dayKey]) S.log[dayKey] = {};
    if (S.log[dayKey][actionId]) delete S.log[dayKey][actionId];
    else S.log[dayKey][actionId] = true;
    save();
    render();
  }

  /* One-off steps, as opposed to habits: book the consult, call the dentist.
     Each is worth a few coins once, and stays listed under Done with its date. */

  function newId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function toggleTodo(td) {
    td.done = !td.done;
    if (td.done) td.doneAt = today(); else delete td.doneAt;
    save();
    render();
  }

  function todoRow(area, td, opts) {
    var li = el('<li class="todo-row"></li>');
    var btn = el(
      '<button class="act' + (td.done ? ' done' : '') + '" type="button">' +
      '<span class="box">✓</span>' +
      '<span class="act-label">' + (opts.withArea ? esc(area.emoji) + ' ' : '') + esc(td.label) + '</span>' +
      '<span class="act-meta">' + (td.done ? esc(td.doneAt || '') : '<b>◎' + TODO_COINS + '</b>') + '</span></button>'
    );
    btn.addEventListener('click', function () { toggleTodo(td); });
    li.appendChild(btn);
    if (opts.removable) {
      var rm = el('<button class="todo-rm" type="button" title="Remove">×</button>');
      rm.addEventListener('click', function () {
        if (!confirm('Remove "' + td.label + '"?')) return;
        area.todos = area.todos.filter(function (x) { return x !== td; });
        save(); render();
      });
      li.appendChild(rm);
    }
    return li;
  }

  function todoCard(area) {
    var open = area.todos.filter(function (td) { return !td.done; });
    var done = area.todos.filter(function (td) { return td.done; });
    var card = el('<div class="card"><div class="card-head"><div><h2>To do</h2>' +
      '<p class="sub">One-off steps that move this forward. Each is worth ◎' + TODO_COINS + ' once.</p></div></div></div>');
    var list = el('<ul class="actions"></ul>');
    open.forEach(function (td) { list.appendChild(todoRow(area, td, { removable: true })); });
    if (!open.length) list.appendChild(el('<li><p class="empty">Nothing open. Add the next step below.</p></li>'));
    card.appendChild(list);

    var add = el('<form class="row todo-add"><input type="text" placeholder="next step, e.g. book a consult">' +
      '<button class="btn" type="submit">Add</button></form>');
    add.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = add.querySelector('input').value.trim();
      if (!v) return;
      area.todos.push({ id: newId('td'), label: v, done: false });
      save(); render();
    });
    card.appendChild(add);

    if (done.length) {
      var det = el('<details class="todo-done"><summary>Done (' + done.length + ')</summary><ul class="actions"></ul></details>');
      var dl = det.querySelector('ul');
      done.slice().sort(function (a, b) { return (b.doneAt || '').localeCompare(a.doneAt || ''); })
        .forEach(function (td) { dl.appendChild(todoRow(area, td, { removable: true })); });
      card.appendChild(det);
    }
    return card;
  }

  // Today's list of open steps across profiles; a discreet profile keeps its own to itself
  function nextStepsCard() {
    var list = el('<ul class="actions"></ul>'), n = 0;
    S.areas.forEach(function (area) {
      if (area.discreet) return;
      area.todos.forEach(function (td) {
        if (td.done) return;
        list.appendChild(todoRow(area, td, { withArea: true }));
        n++;
      });
    });
    if (!n) return null;
    var card = el('<div class="card"><div class="card-head"><div><h2>Next steps</h2>' +
      '<p class="sub">Open to-dos from every profile. Add more on each profile’s page.</p></div></div></div>');
    card.appendChild(list);
    return card;
  }

  function dayNoteCard() {
    var t = today();
    var note = el(
      '<div class="card"><div class="card-head"><div><h2>Note for today</h2>' +
      '<p class="sub">Anything you noticed — triggers, flare-ups, what helped.</p></div></div>' +
      '<textarea placeholder="e.g. ear was louder after the loud restaurant; knee felt solid on the stairs"></textarea></div>'
    );
    var ta = note.querySelector('textarea');
    ta.value = S.notes[t] || '';
    ta.addEventListener('change', function () { S.notes[t] = ta.value; save(); });
    return note;
  }

  /* ------------------------------------------------------------- view: today */

  function renderToday(root) {
    var days = week(), overall = overallScore(days);

    var hero = el(
      '<div class="card"><div class="hero">' +
      ring(overall, 108, 12, 'var(--accent)') +
      '<div class="hero-stats">' +
      '<div class="big">' + pct(overall) + '% overall</div>' +
      '<div class="label">rolling 7-day consistency across ' + S.areas.length + ' area' + (S.areas.length === 1 ? '' : 's') + '</div>' +
      '<div class="pillrow">' +
      '<span class="pill gold">◎ ' + coinsToday() + ' earned today</span>' +
      '<span class="pill' + (streak() > 0 ? ' good' : '') + '">' + streak() + '-day streak</span>' +
      '</div></div></div></div>'
    );

    if (S.areas.length) {
      var summary = el('<div class="summary"></div>');
      S.areas.forEach(function (area) {
        var b = el('<button class="sum" type="button" title="Open the ' + esc(shortName(area.name)) + ' profile">' +
          ring(areaScore(area, days), 52, 6, esc(area.color)) +
          '<span class="sum-name">' + esc(area.emoji) + ' ' + esc(shortName(area.name)) + '</span></button>');
        b.addEventListener('click', function () { go('area:' + area.id); });
        summary.appendChild(b);
      });
      hero.appendChild(summary);
    }
    root.appendChild(hero);

    if (sealedPending().length && !storedSealKey() && window.crypto && window.crypto.subtle) root.appendChild(unlockCard());

    var steps = nextStepsCard();
    if (steps) root.appendChild(steps);

    if (!S.areas.length) {
      root.appendChild(el('<div class="card"><p class="empty">No profiles yet. Add one below.</p></div>'));
    }

    S.areas.forEach(function (area) {
      var card = el('<div class="card area" style="border-left-color:' + esc(area.color) + '"></div>');
      var head = el('<button class="area-link" type="button">' +
        '<span class="emoji">' + esc(area.emoji) + '</span>' +
        '<span class="grow">' + esc(area.name) + '</span>' +
        '<span class="muted">profile ›</span></button>');
      head.addEventListener('click', function () { go('area:' + area.id); });
      card.appendChild(head);
      card.appendChild(logBlock(area, { quiet: !area.actions.length }));
      root.appendChild(card);
    });

    root.appendChild(dayNoteCard());
    root.appendChild(appCard());
  }

  /* ----------------------------------------------------------- view: profile */

  /* What the data is actually saying about this area, in sentences. */
  function findings(area) {
    var out = [], days = week(), prev = prevWeek(), t = today();

    area.metrics.forEach(function (m) {
      if (!m.label) return;
      var now = (S.metrics[t] || {})[m.id];
      if (typeof now === 'number') {
        var sn = standoutNote(m, now);
        if (sn) out.push({ text: m.label + ' is ' + now + '/10 today — ' + sn.text + '.', tone: sn.cls });
      }
      var a = metricAvg(m.id, days), b = metricAvg(m.id, prev);
      if (a != null && b != null && Math.abs(a - b) >= 0.3) {
        var better = m.lowerIsBetter ? a < b : a > b;
        out.push({
          text: m.label + ' averaged ' + a.toFixed(1) + ' this week against ' + b.toFixed(1) + ' last — ' +
            (better ? 'moving the right way' : 'moving the wrong way') + '.',
          tone: better ? 'good' : 'bad'
        });
      }
    });

    computePatterns().filter(function (p) { return p.area.id === area.id; }).forEach(function (p) {
      var r = patternLine(p);
      if (!r.enough) return;
      var diff = p.on.avg - p.off.avg;
      if (Math.abs(diff) < 0.4) return;
      var better = p.metric.lowerIsBetter ? diff < 0 : diff > 0;
      out.push({
        text: p.name + ': ' + p.metric.label.toLowerCase() + ' runs ' + p.on.avg.toFixed(1) + ' ' + p.onWord +
          ' against ' + p.off.avg.toFixed(1) + ' ' + p.offWord + ' (' + p.on.n + ' days vs ' + p.off.n + ').',
        tone: better ? 'good' : 'bad'
      });
    });

    var now = areaScore(area, days), before = areaScore(area, prev);
    if (area.actions.length) {
      var d = pct(now) - pct(before);
      out.push({
        text: 'You are holding ' + pct(now) + '% of this profile’s habits' +
          (Math.abs(d) < 3 ? ', about the same as last week.' : (d > 0 ? ', up ' + d + ' points on last week.' : ', down ' + Math.abs(d) + ' points on last week.')),
        tone: Math.abs(d) < 3 ? 'flat' : (d > 0 ? 'good' : 'bad')
      });
    }

    return out;
  }

  function renderProfile(root, area) {
    var days = week();

    var back = el('<button class="backlink" type="button">‹ All profiles</button>');
    back.addEventListener('click', function () { go('today'); });
    root.appendChild(back);

    root.appendChild(el(
      '<div class="card area prof-head" style="border-left-color:' + esc(area.color) + '">' +
      '<div class="area-top">' + ring(areaScore(area, days), 72, 9, esc(area.color)) +
      '<div class="grow"><h2><span class="emoji">' + esc(area.emoji) + '</span> ' + esc(area.name) + '</h2>' +
      (area.note ? '<p class="sub">' + esc(area.note) + '</p>' : '') +
      '<p class="sub">' + (area.actions.length ? pct(areaScore(area, days)) + '% consistency over the last 7 days'
        : area.todos.filter(function (td) { return td.done; }).length + ' of ' + area.todos.length + ' to-dos done') + '</p>' +
      '</div></div></div>'
    ));

    /* --- to-dos --- */
    root.appendChild(todoCard(area));

    /* --- findings --- */
    var f = findings(area);
    var fc = el('<div class="card"><div class="card-head"><div><h2>Findings</h2>' +
      '<p class="sub">What your own entries are saying, updated as you log.</p></div></div></div>');
    if (f.length) {
      f.forEach(function (x) {
        fc.appendChild(el('<div class="finding"><span class="tone ' + x.tone + '"></span>' +
          '<span>' + esc(x.text) + '</span></div>'));
      });
    } else {
      fc.appendChild(el('<p class="empty">Nothing conclusive yet. Log a few more days and findings will appear here.</p>'));
    }
    root.appendChild(fc);

    /* --- background --- */
    var hc = el('<div class="card"><div class="card-head"><div><h2>Background &amp; history</h2>' +
      '<p class="sub">Injuries, surgeries, dates — the context a clinician would want.</p></div></div>' +
      '<textarea class="h-text" rows="6" placeholder="what happened, when, and what has changed since"></textarea></div>');
    var hta = hc.querySelector('textarea');
    hta.value = area.history || '';
    hta.addEventListener('change', function () { area.history = hta.value; save(); });
    root.appendChild(hc);

    /* --- log --- */
    var lc = el('<div class="card"><div class="card-head"><div><h2>Today</h2>' +
      '<p class="sub">Check off what you did, tag what the day was like, rate how it feels.</p></div></div></div>');
    lc.appendChild(logBlock(area, { quiet: false }));
    root.appendChild(lc);

    /* --- trends --- */
    var rated = area.metrics.filter(function (m) { return m.label; });
    var d14 = lastDays(14);
    var tc = el('<div class="card"><div class="card-head"><div><h2>Over time</h2>' +
      '<p class="sub">Last 14 days.</p></div></div></div>');

    var bars = el('<div class="bars"></div>'), xs = el('<div class="bars-x"></div>');
    d14.forEach(function (k) {
      var v = areaDayCompletion(area, k);
      var col = el('<div><span style="height:' + Math.round(Math.min(1, v) * 100) + '%;background:' + esc(area.color) + '"></span></div>');
      col.title = k + ' — ' + pct(Math.min(1, v)) + '%';
      bars.appendChild(col);
      xs.appendChild(el('<span>' + weekdayShort(k) + '</span>'));
    });
    tc.appendChild(el('<h3 class="section" style="margin-top:0">Habits kept</h3>'));
    tc.appendChild(bars); tc.appendChild(xs);

    if (rated.length) {
      tc.appendChild(el('<h3 class="section">Ratings</h3>'));
      rated.forEach(function (m) {
        var vals = d14.map(function (k) { return (S.metrics[k] || {})[m.id]; });
        var known = vals.filter(function (v) { return typeof v === 'number'; });
        var a = metricAvg(m.id, days), b = metricAvg(m.id, prevWeek());
        var desc = 'no ratings yet', cls = 'flat', label = '—';
        if (a != null) {
          label = a.toFixed(1);
          desc = '7-day average out of 10';
          if (b != null) {
            var diff = a - b;
            var better = m.lowerIsBetter ? diff < 0 : diff > 0;
            desc = b.toFixed(1) + ' → ' + a.toFixed(1) + (Math.abs(diff) < 0.2 ? ' · steady' : (better ? ' · better' : ' · worse'));
            cls = Math.abs(diff) < 0.2 ? 'flat' : (better ? 'up' : 'down');
          }
        }
        var filled = [], last = 5;
        vals.forEach(function (v) { if (typeof v === 'number') last = v; filled.push(last); });
        tc.appendChild(el(
          '<div class="trend"><div style="flex:none">' + (known.length ? sparkline(filled, esc(area.color), m.lowerIsBetter) : '<div style="width:120px"></div>') + '</div>' +
          '<div class="grow"><div class="name">' + esc(m.label) + '</div><div class="desc">' + esc(desc) + '</div></div>' +
          '<div class="delta ' + cls + '">' + label + '</div></div>'
        ));
      });
    }
    root.appendChild(tc);

    /* --- notes mentioning this area's days --- */
    var recent = lastDays(14).slice().reverse().filter(function (k) { return (S.notes[k] || '').trim(); });
    if (recent.length) {
      var nc = el('<div class="card"><div class="card-head"><div><h2>Recent notes</h2>' +
        '<p class="sub">Your own words, last 14 days.</p></div></div></div>');
      recent.slice(0, 8).forEach(function (k) {
        nc.appendChild(el('<div class="trend"><div class="grow"><div class="desc">' + esc(k) + '</div>' +
          '<div class="name">' + esc(S.notes[k]) + '</div></div></div>'));
      });
      root.appendChild(nc);
    }

    root.appendChild(summaryCard(area));
    root.appendChild(setupCard(area));
  }

  /* how much of this area's own daily share was covered on a given day */
  function areaDayCompletion(area, dayKey) {
    var earned = 0, expected = 0;
    area.actions.forEach(function (act) {
      expected += (Math.max(1, act.coins || 1) * Math.max(1, act.target || 1)) / 7;
      if (isDone(dayKey, act.id)) earned += Math.max(1, act.coins || 1);
    });
    return expected ? Math.min(1.2, earned / expected) : 0;
  }

  /* ------------------------------------------------- summary for a clinician */

  function summaryCard(area) {
    var who = area ? 'this profile' : 'every profile';
    var card = el('<div class="card"><div class="card-head"><div><h2>Take it to an appointment</h2>' +
      '<p class="sub">Everything the tracker knows about ' + who + ', as plain text — background, ' +
      'ratings with 7- and 30-day averages, what you did, and how tagged days compare.</p></div></div>' +
      '<textarea class="s-text" readonly rows="8"></textarea>' +
      '<div class="btnrow"><button class="btn primary s-copy">Copy</button>' +
      '<button class="btn s-save">Download .txt</button></div></div>');
    var sText = card.querySelector('.s-text');
    sText.value = appointmentSummary(area);
    card.querySelector('.s-copy').addEventListener('click', function (e) {
      var btn = e.target;
      sText.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(sText.value).then(function () {
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
        }, function () { btn.textContent = 'Select all and copy'; });
      } else {
        btn.textContent = 'Select all and copy';
      }
    });
    card.querySelector('.s-save').addEventListener('click', function () {
      offerDownload('growth-rings-' + (area ? shortName(area.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'summary') +
        '-' + today() + '.txt', sText.value);
    });
    return card;
  }

  function appointmentSummary(only) {
    var L = [], t = today();
    L.push('Growth Rings — summary prepared ' + t);
    L.push('Self-tracked by the patient. Not a clinical record.');

    S.areas.filter(function (a) { return only ? a.id === only.id : !a.discreet; }).forEach(function (area) {
      L.push('');
      L.push('=== ' + area.name + ' ===');
      if (area.note) L.push(area.note);
      if (area.history) { L.push(''); L.push(area.history); }

      if (area.todos.length) {
        L.push('');
        L.push('Next steps');
        area.todos.forEach(function (td) {
          L.push('  [' + (td.done ? 'x' : ' ') + '] ' + td.label + (td.done && td.doneAt ? ' (done ' + td.doneAt + ')' : ''));
        });
      }

      var rated = area.metrics.filter(function (m) { return m.label; });
      if (rated.length) {
        L.push('');
        L.push('Daily 0–10 ratings');
        rated.forEach(function (m) {
          var now = (S.metrics[t] || {})[m.id];
          var a7 = metricAvg(m.id, lastDays(7));
          var a30 = metricAvg(m.id, lastDays(30));
          var note = (typeof now === 'number') ? standoutNote(m, now) : null;
          L.push('  - ' + m.label + ' (' + (m.lowerIsBetter ? '0 best, 10 worst' : '0 worst, 10 best') + '): ' +
            'today ' + (typeof now === 'number' ? now : 'not rated') +
            ', 7-day avg ' + (a7 == null ? '—' : a7.toFixed(1)) +
            ', 30-day avg ' + (a30 == null ? '—' : a30.toFixed(1)) +
            (note ? ' — ' + note.text : ''));
        });
      }

      if (area.actions.length) {
        var d14 = lastDays(14);
        L.push('');
        L.push('What was done, last 14 days');
        area.actions.forEach(function (act) {
          L.push('  - ' + act.label + ': ' + hits(act.id, d14) + ' of ' + (act.target * 2) + ' planned');
        });
      }

      var tagged = area.flags.filter(function (f) {
        return Object.keys(S.flags).some(function (d) { return S.flags[d][f.id]; });
      });
      if (tagged.length) {
        L.push('');
        L.push('Days tagged (all history)');
        tagged.forEach(function (f) {
          var n = Object.keys(S.flags).filter(function (d) { return S.flags[d][f.id]; });
          var last = n.slice().sort().pop();
          L.push('  - ' + f.label + ': ' + n.length + (n.length === 1 ? ' day' : ' days') + ', most recently ' + last);
        });
      }

      var pats = computePatterns().filter(function (p) { return p.area.id === area.id; });
      var shown = [];
      pats.forEach(function (p) {
        var r = patternLine(p);
        if (r.enough) shown.push('  - ' + p.name + ': ' + r.desc + ' (' + r.label + ')');
      });
      if (shown.length) {
        L.push('');
        L.push('Ratings on tagged days vs other days');
        shown.forEach(function (x) { L.push(x); });
      }
    });

    var notes = [];
    Object.keys(S.notes).forEach(function (d) { if ((S.notes[d] || '').trim()) notes.push(d); });
    notes.sort().reverse();
    if (notes.length) {
      L.push('');
      L.push('=== Recent notes ===');
      notes.slice(0, 20).forEach(function (d) { L.push('  ' + d + ' — ' + S.notes[d].replace(/\s+/g, ' ')); });
    }

    return L.join('\n');
  }

  function offerDownload(name, text) {
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('downloads').then(function (dl) {
        if (dl) dl.save({ filename: name, data: text }).catch(function () { /* declined */ });
        else anchorSave(name, text);
      }).catch(function () { anchorSave(name, text); });
    } else {
      anchorSave(name, text);
    }
  }

  /* ------------------------------------------------------------- view: coins */

  function renderCoins(root) {
    var days = week(), bal = balance();

    var weakest = S.areas.filter(function (a) { return a.actions.length; })
      .sort(function (a, b) { return areaScore(a, days) - areaScore(b, days); })[0];
    var strongest = S.areas.filter(function (a) { return a.actions.length; })
      .sort(function (a, b) { return areaScore(b, days) - areaScore(a, days); })[0];

    root.appendChild(el(
      '<div class="card"><div class="hero">' + ring(Math.min(1, bal / 1000), 108, 12, 'var(--gold)') +
      '<div class="hero-stats"><div class="big">◎ ' + bal + '</div>' +
      '<div class="label">coins banked · ' + coinsEarned() + ' earned all-time, ' + (S.spent || 0) + ' invested</div>' +
      '<div class="pillrow"><span class="pill gold">◎ ' + coinsToday() + ' today</span>' +
      '<span class="pill">ring fills at ◎1000</span></div></div></div></div>'
    ));

    if (weakest) {
      var wc = el('<div class="card"><div class="card-head"><div><h2>Where to put attention</h2>' +
        '<p class="sub">Lowest consistency over the last 7 days.</p></div></div></div>');
      var row = el('<button class="area-link" type="button">' + ring(areaScore(weakest, days), 42, 6, esc(weakest.color)) +
        '<span class="grow"><span class="name">' + esc(weakest.emoji) + ' ' + esc(weakest.name) + '</span>' +
        '<span class="desc">at ' + pct(areaScore(weakest, days)) + '% — one more rep this week moves it most</span></span>' +
        '<span class="muted">profile ›</span></button>');
      row.addEventListener('click', function () { go('area:' + weakest.id); });
      wc.appendChild(row);
      if (strongest && strongest !== weakest) {
        wc.appendChild(el('<p class="muted" style="margin:10px 0 0">Meanwhile ' + esc(shortName(strongest.name)) +
          ' is holding at ' + pct(areaScore(strongest, days)) + '%. Keep that one on cruise.</p>'));
      }
      root.appendChild(wc);
    }

    var card = el('<div class="card"><div class="card-head"><div><h2>Invest your coins</h2>' +
      '<p class="sub">Real things that move an area forward. Spend the coins when you book it.</p></div></div>' +
      '<div class="inv-list"></div></div>');
    var list = card.querySelector('.inv-list');

    S.investments.forEach(function (inv) {
      var area = S.areas.filter(function (a) { return a.id === inv.areaId; })[0];
      var r = el('<div class="inv"><div class="grow">' +
        '<div class="name">' + (inv.done ? '✅ ' : '') + esc(inv.name) + '</div>' +
        '<div class="why">' + (area ? esc(area.emoji) + ' ' + esc(shortName(area.name)) : 'general') +
        (inv.done ? ' · invested' : '') + '</div></div>' +
        '<div class="cost">◎' + inv.cost + '</div></div>');
      if (!inv.done) {
        var b = el('<button class="btn' + (bal >= inv.cost ? ' primary' : '') + '"' + (bal >= inv.cost ? '' : ' disabled') + '>Invest</button>');
        b.addEventListener('click', function () {
          S.spent = (S.spent || 0) + inv.cost;
          inv.done = true; inv.doneAt = today();
          save(); render();
        });
        r.appendChild(b);
      } else {
        var u = el('<button class="btn ghost">Undo</button>');
        u.addEventListener('click', function () {
          S.spent = Math.max(0, (S.spent || 0) - inv.cost);
          inv.done = false; delete inv.doneAt;
          save(); render();
        });
        r.appendChild(u);
      }
      list.appendChild(r);
    });
    if (!S.investments.length) list.appendChild(el('<p class="empty">No investments yet — add one below.</p>'));

    var form = el('<div style="border-top:1px solid var(--line);margin-top:12px;padding-top:12px">' +
      '<label class="field"><span>New investment</span><input type="text" class="i-name" placeholder="e.g. physio appointment"></label>' +
      '<div class="grid2"><label class="field"><span>Cost in coins</span><input type="number" class="i-cost" value="300" min="0" step="10"></label>' +
      '<label class="field"><span>Profile</span><select class="i-area"></select></label></div>' +
      '<button class="btn">Add investment</button></div>');
    var sel = form.querySelector('.i-area');
    S.areas.forEach(function (a) { sel.appendChild(el('<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>')); });
    sel.appendChild(el('<option value="">General</option>'));
    form.querySelector('button').addEventListener('click', function () {
      var name = form.querySelector('.i-name').value.trim();
      if (!name) return;
      S.investments.push({ id: uid(), name: name, cost: Math.max(0, +form.querySelector('.i-cost').value || 0), areaId: sel.value, done: false });
      save(); render();
    });
    card.appendChild(form);
    root.appendChild(card);
  }

  /* ------------------------------------------------------- setup for an area */

  function setupCard(area) {
    var idx = S.areas.indexOf(area);
    var card = el('<details class="card setup"><summary>Set up this profile</summary><div class="setup-body"></div></details>');
    var body = card.querySelector('.setup-body');

    var head = el('<div class="row" style="margin-bottom:10px">' +
      '<input type="text" class="w-emoji a-emoji" value="' + esc(area.emoji) + '" maxlength="3">' +
      '<input type="text" class="grow a-name" value="' + esc(area.name) + '"></div>');
    head.querySelector('.a-emoji').addEventListener('change', function (e) { area.emoji = e.target.value; save(); render(); });
    head.querySelector('.a-name').addEventListener('change', function (e) { area.name = e.target.value; save(); render(); });
    body.appendChild(head);

    var note = el('<label class="field"><span>One-line note, shown under the title</span>' +
      '<input type="text" class="a-note" value="' + esc(area.note || '') + '" placeholder="what is going on here"></label>');
    note.querySelector('input').addEventListener('change', function (e) { area.note = e.target.value; save(); render(); });
    body.appendChild(note);

    var sw = el('<div class="swatches" style="margin-bottom:12px"></div>');
    PALETTE.forEach(function (c) {
      var b = el('<button class="swatch' + (c === area.color ? ' on' : '') + '" style="background:' + c + '" aria-label="colour"></button>');
      b.addEventListener('click', function () { area.color = c; save(); render(); });
      sw.appendChild(b);
    });
    body.appendChild(sw);

    body.appendChild(el('<h3 class="section" style="margin-top:4px">Habits · times per week · coins</h3>'));
    area.actions.forEach(function (act) {
      var row = el('<div class="row" style="margin-bottom:8px">' +
        '<input type="text" class="grow x-label" value="' + esc(act.label) + '">' +
        '<input type="number" class="w-target x-target" min="1" max="7" value="' + act.target + '">' +
        '<input type="number" class="w-coins x-coins" min="1" max="20" value="' + act.coins + '">' +
        '<button class="btn ghost x-del" title="remove habit">✕</button></div>');
      row.querySelector('.x-label').addEventListener('change', function (e) { act.label = e.target.value; save(); });
      row.querySelector('.x-target').addEventListener('change', function (e) { act.target = Math.max(1, Math.min(7, +e.target.value || 1)); save(); render(); });
      row.querySelector('.x-coins').addEventListener('change', function (e) { act.coins = Math.max(1, +e.target.value || 1); save(); render(); });
      row.querySelector('.x-del').addEventListener('click', function () {
        if (!confirm('Remove "' + act.label + '"? Past check-ins stay in your history.')) return;
        S.archive[act.id] = { coins: act.coins };
        area.actions = area.actions.filter(function (x) { return x.id !== act.id; });
        save(); render();
      });
      body.appendChild(row);
    });
    var addAct = el('<div class="row" style="margin-top:10px">' +
      '<input type="text" class="grow n-label" placeholder="add a habit…"><button class="btn">Add</button></div>');
    addAct.querySelector('button').addEventListener('click', function () {
      var v = addAct.querySelector('.n-label').value.trim();
      if (!v) return;
      area.actions.push({ id: uid(), label: v, coins: 2, target: 5 });
      save(); render();
    });
    body.appendChild(addAct);

    body.appendChild(el('<h3 class="section">Daily 0–10 ratings</h3>'));
    area.metrics.forEach(function (m) {
      var block = el('<div class="subblock">' +
        '<div class="row" style="margin-bottom:8px">' +
        '<input type="text" class="grow m-label" value="' + esc(m.label) + '" placeholder="e.g. tinnitus loudness">' +
        '<button class="btn ghost m-del" title="remove rating">✕</button></div>' +
        '<div class="grid2"><label class="field"><span>0 means…</span><input type="text" class="m-low" value="' + esc(m.low || '') + '"></label>' +
        '<label class="field"><span>10 means…</span><input type="text" class="m-high" value="' + esc(m.high || '') + '"></label></div>' +
        '<label class="chk"><input type="checkbox" class="m-lower"' + (m.lowerIsBetter ? ' checked' : '') + '> Lower is better</label></div>');
      block.querySelector('.m-label').addEventListener('change', function (e) { m.label = e.target.value; save(); render(); });
      block.querySelector('.m-low').addEventListener('change', function (e) { m.low = e.target.value; save(); });
      block.querySelector('.m-high').addEventListener('change', function (e) { m.high = e.target.value; save(); });
      block.querySelector('.m-lower').addEventListener('change', function (e) { m.lowerIsBetter = e.target.checked; save(); });
      block.querySelector('.m-del').addEventListener('click', function () {
        if (!confirm('Remove the "' + (m.label || 'untitled') + '" rating? Past ratings stay in your history.')) return;
        area.metrics = area.metrics.filter(function (x) { return x.id !== m.id; });
        save(); render();
      });
      body.appendChild(block);
    });
    var addMet = el('<div class="row" style="margin-top:10px">' +
      '<input type="text" class="grow nm-label" placeholder="add a rating…"><button class="btn">Add</button></div>');
    addMet.querySelector('button').addEventListener('click', function () {
      var v = addMet.querySelector('.nm-label').value.trim();
      if (!v) return;
      area.metrics.push({ id: uid(), label: v, low: '', high: '', lowerIsBetter: false });
      save(); render();
    });
    body.appendChild(addMet);

    body.appendChild(el('<h3 class="section">Day tags</h3>'));
    body.appendChild(el('<p class="muted" style="margin:-4px 0 10px">What a day was like. Mark one as something you were ' +
      'exposed to, or something that protected you, and Findings compares your ratings across them.</p>'));
    area.flags.forEach(function (flag) {
      var row = el('<div class="row" style="margin-bottom:8px">' +
        '<input type="text" class="grow f-label" value="' + esc(flag.label) + '">' +
        '<select class="f-kind"><option value="">plain</option>' +
        '<option value="exposure"' + (flag.kind === 'exposure' ? ' selected' : '') + '>exposure</option>' +
        '<option value="protection"' + (flag.kind === 'protection' ? ' selected' : '') + '>protection</option></select>' +
        '<button class="btn ghost f-del" title="remove tag">✕</button></div>');
      row.querySelector('.f-label').addEventListener('change', function (e) { flag.label = e.target.value; save(); });
      row.querySelector('.f-kind').addEventListener('change', function (e) { flag.kind = e.target.value; save(); render(); });
      row.querySelector('.f-del').addEventListener('click', function () {
        if (!confirm('Remove the "' + flag.label + '" tag? Days you already tagged stay in your history.')) return;
        area.flags = area.flags.filter(function (x) { return x.id !== flag.id; });
        save(); render();
      });
      body.appendChild(row);
    });
    var addFlagRow = el('<div class="row" style="margin-top:10px">' +
      '<input type="text" class="grow nf-label" placeholder="add a day tag…"><button class="btn">Add</button></div>');
    addFlagRow.querySelector('button').addEventListener('click', function () {
      var v = addFlagRow.querySelector('.nf-label').value.trim();
      if (!v) return;
      area.flags.push({ id: uid(), label: v, kind: '' });
      save(); render();
    });
    body.appendChild(addFlagRow);

    var tools = el('<div class="btnrow"></div>');
    if (idx > 0) {
      var up = el('<button class="btn ghost">↑ Move earlier</button>');
      up.addEventListener('click', function () {
        var a = S.areas.splice(idx, 1)[0]; S.areas.splice(idx - 1, 0, a); save(); render();
      });
      tools.appendChild(up);
    }
    var del = el('<button class="btn ghost">Delete this profile</button>');
    del.addEventListener('click', function () {
      if (!confirm('Delete "' + area.name + '" and its habits?')) return;
      area.actions.forEach(function (act) { S.archive[act.id] = { coins: act.coins }; });
      S.areas = S.areas.filter(function (x) { return x.id !== area.id; });
      save(); go('today');
    });
    tools.appendChild(del);
    body.appendChild(tools);

    return card;
  }

  /* ----------------------------------------------------------- app and data */

  function appCard() {
    var card = el('<details class="card setup"><summary>New profile, backups &amp; everything else</summary>' +
      '<div class="setup-body"></div></details>');
    var body = card.querySelector('.setup-body');

    body.appendChild(el('<h3 class="section" style="margin-top:0">Add a profile</h3>'));
    body.appendChild(el('<p class="muted" style="margin:-4px 0 10px">Sleep, back, nutrition, stress — anything you want to understand.</p>'));
    var na = el('<div class="row"><input type="text" class="w-emoji na-emoji" value="🌱" maxlength="3">' +
      '<input type="text" class="grow na-name" placeholder="profile name"><button class="btn primary">Add</button></div>');
    na.querySelector('button').addEventListener('click', function () {
      var name = na.querySelector('.na-name').value.trim();
      if (!name) return;
      var a = {
        id: uid(), name: name, emoji: na.querySelector('.na-emoji').value || '🌱',
        color: PALETTE[S.areas.length % PALETTE.length], note: '', history: '',
        metrics: [], flags: [], actions: []
      };
      S.areas.push(a);
      save(); go('area:' + a.id);
    });
    body.appendChild(na);

    body.appendChild(el('<h3 class="section">Everything, as one summary</h3>'));
    body.appendChild(summaryCard(null));

    body.appendChild(el('<h3 class="section">Your data</h3>'));
    var data = el('<div><p class="muted" style="margin:0 0 10px">Export a copy before you clear site data or switch phones.</p>' +
      '<div class="btnrow"><button class="btn d-export">Export backup</button>' +
      '<button class="btn d-import">Import backup</button>' +
      '<button class="btn ghost d-reset">Reset everything</button></div>' +
      '<input type="file" accept="application/json" class="d-file" hidden>' +
      '<div class="sync"><span class="dot"></span><span class="sync-text"></span></div></div>');
    data.querySelector('.sync-text').textContent = SYNC_TEXT[syncState] || SYNC_TEXT.local;
    data.querySelector('.sync').classList.toggle('on', syncState === 'synced');
    data.querySelector('.d-export').addEventListener('click', function () {
      offerDownload('growth-rings-' + today() + '.json', JSON.stringify(S, null, 2));
    });
    var file = data.querySelector('.d-file');
    data.querySelector('.d-import').addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f = file.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var parsed = JSON.parse(r.result);
          if (!parsed.areas) throw new Error('not a Growth Rings backup');
          S = parsed;
          var base = seed();
          Object.keys(base).forEach(function (k) { if (!(k in S)) S[k] = base[k]; });
          migrate(S);
          save(); render();
        } catch (e) { alert('Could not read that file: ' + e.message); }
      };
      r.readAsText(f);
    });
    data.querySelector('.d-reset').addEventListener('click', function () {
      if (!confirm('Wipe all profiles, history and coins, back to the starting setup?')) return;
      S = migrate(seed()); save(); render();
    });
    body.appendChild(data);

    return card;
  }

  /* --------------------------------------------------- sync with your account */
  /* Published as an Artifact, this page can keep the same data on your Claude
     account so your check-ins follow you between phone and laptop. Opened as a
     local file it is simply absent, and local storage is the whole story. */

  var cloudDoc = null, cloudTimer = null, syncState = 'local';

  var SYNC_TEXT = {
    local: 'Everything stays in this browser. Export a backup from the Areas tab.',
    linking: 'Connecting to your account…',
    synced: 'Synced to your account — your check-ins follow you between devices.',
    toobig: 'This browser holds your full history; it has outgrown account sync. Export a backup.',
    error: 'Saved in this browser. Account sync is not reachable right now.'
  };

  function setSync(next) {
    syncState = next;
    var line = document.getElementById('storageLine');
    if (line) line.textContent = SYNC_TEXT[next] || SYNC_TEXT.local;
    var badge = document.querySelector('.sync');
    if (badge) {
      badge.classList.toggle('on', next === 'synced');
      badge.querySelector('.sync-text').textContent = SYNC_TEXT[next] || SYNC_TEXT.local;
    }
  }

  function scheduleCloud() {
    if (!cloudDoc) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(cloudPush, 1200);
  }

  function cloudPush() {
    if (!cloudDoc) return;
    var payload = JSON.stringify(S);
    if (payload.length > 200000) { setSync('toobig'); return; }
    cloudDoc.set({ v: 1, payload: payload, updatedAt: S.updatedAt || Date.now() })
      .then(function () { setSync('synced'); })
      .catch(function () { setSync('error'); });
  }

  function adopt(payload) {
    try {
      var incoming = JSON.parse(payload);
      if (!incoming || !incoming.areas) return;
      var base = seed();
      Object.keys(base).forEach(function (k) { if (!(k in incoming)) incoming[k] = base[k]; });
      S = migrate(incoming);
      saveLocal();
      render();
      setSync('synced');
    } catch (e) { /* a body we can't read is better ignored than acted on */ }
  }

  if (window.claude && typeof window.claude.use === 'function') {
    setSync('linking');
    window.claude.use('db').then(function (db) {
      if (!db) { setSync('local'); return; }
      cloudDoc = db.doc('state/main');
      cloudDoc.onSnapshot(function (snap) {
        if (!snap.exists) { cloudPush(); return; }
        var d = snap.data() || {};
        if (typeof d.payload !== 'string') return;
        if ((d.updatedAt || 0) <= (S.updatedAt || 0)) { setSync('synced'); return; }
        adopt(d.payload);
      }, function () { setSync('error'); });
    }).catch(function () { setSync('local'); });
  }

  /* ------------------------------------------------------------------- shell */

  function render() {
    document.getElementById('coinBalance').textContent = balance();
    document.getElementById('dateLine').textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    var area = currentArea();
    if (String(S.view).indexOf('area:') === 0 && !area) S.view = 'today';

    renderNav();

    var root = document.getElementById('app');
    root.innerHTML = '';
    if (area) renderProfile(root, area);
    else if (S.view === 'coins') renderCoins(root);
    else renderToday(root);
    autoUnseal();
  }

  document.querySelector('.brand').addEventListener('click', function () { go('today'); });
  document.querySelector('.coin-chip').addEventListener('click', function () { go('coins'); });

  render();
})();
