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
          id: 'ear', name: 'Ear — pulsatile tinnitus', emoji: '👂', color: '#7fd4e8',
          note: 'Unilateral. Earplugs have been the thing that helps most so far.',
          metric: { label: 'Tinnitus loudness', low: 'quiet', high: 'loud', lowerIsBetter: true },
          actions: [
            { id: 'ear1', label: 'Earplugs in loud environments', coins: 3, target: 7 },
            { id: 'ear2', label: 'Quiet wind-down before bed', coins: 2, target: 5 },
            { id: 'ear3', label: 'Note episodes + what triggered them', coins: 1, target: 7 }
          ]
        },
        {
          id: 'knee', name: 'Right knee — ACL', emoji: '🦵', color: '#31d0aa',
          note: 'Torn, then healed. Goal: strong enough to trust in sport again.',
          metric: { label: 'Knee confidence', low: 'shaky', high: 'solid', lowerIsBetter: false },
          actions: [
            { id: 'knee1', label: 'Quad + hamstring strength set', coins: 4, target: 4 },
            { id: 'knee2', label: 'Single-leg balance & control', coins: 3, target: 3 },
            { id: 'knee3', label: 'Mobility / warm-up before activity', coins: 2, target: 5 },
            { id: 'knee4', label: 'Low-impact cardio (bike, swim, walk)', coins: 3, target: 3 }
          ]
        },
        {
          id: 'shoulder', name: 'Shoulder — tightness', emoji: '🫱', color: '#7aa2f7',
          note: 'Still figuring out the cause. Track what loosens it.',
          metric: { label: 'Shoulder tightness', low: 'loose', high: 'tight', lowerIsBetter: true },
          actions: [
            { id: 'sh1', label: 'Shoulder mobility / stretch routine', coins: 3, target: 5 },
            { id: 'sh2', label: 'Posture reset breaks during the day', coins: 1, target: 5 },
            { id: 'sh3', label: 'Rotator cuff + scapular strength', coins: 3, target: 3 }
          ]
        },
        {
          id: 'teeth', name: 'Teeth', emoji: '🦷', color: '#e08bb0',
          note: '',
          metric: { label: 'Mouth comfort', low: 'sore', high: 'great', lowerIsBetter: false },
          actions: [
            { id: 'th1', label: 'Brush morning + night', coins: 2, target: 7 },
            { id: 'th2', label: 'Floss', coins: 2, target: 7 },
            { id: 'th3', label: 'Night guard / unclench jaw', coins: 1, target: 7 }
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
      metrics: {},    // 'YYYY-MM-DD' -> { areaId: 0..10 }
      notes: {},      // 'YYYY-MM-DD' -> string
      archive: {},    // actionId -> { coins } for deleted actions, so past coins survive
      spent: 0,
      view: 'today'
    };
  }

  /* ------------------------------------------------------------------- state */

  var S = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      var parsed = JSON.parse(raw);
      var base = seed();
      Object.keys(base).forEach(function (k) { if (!(k in parsed)) parsed[k] = base[k]; });
      return parsed;
    } catch (e) {
      return seed();
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: run in memory */ }
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

  function coinsEarned() {
    var total = 0;
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
    return sum;
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

  /* ------------------------------------------------------------- view: today */

  function renderToday() {
    var root = document.getElementById('view-today');
    root.innerHTML = '';
    var t = today(), days = week();

    var overall = overallScore(days);
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
    root.appendChild(hero);

    if (!S.areas.length) {
      root.appendChild(el('<div class="card"><p class="empty">No areas yet. Add one in the <b>Areas</b> tab.</p></div>'));
      return;
    }

    S.areas.forEach(function (area) {
      var score = areaScore(area, days);
      var card = el('<div class="card area" style="border-left-color:' + esc(area.color) + '"></div>');

      card.appendChild(el(
        '<div class="area-top">' + ring(score, 62, 8, esc(area.color)) +
        '<div class="grow"><h2><span class="emoji">' + esc(area.emoji) + '</span> ' + esc(area.name) + '</h2>' +
        (area.note ? '<p class="sub">' + esc(area.note) + '</p>' : '') + '</div></div>'
      ));

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
      if (!area.actions.length) list.appendChild(el('<li><p class="empty">No habits here yet — add some in Areas.</p></li>'));
      card.appendChild(list);

      if (area.metric && area.metric.label) {
        var cur = (S.metrics[t] || {})[area.id];
        var m = el(
          '<div class="metric">' +
          '<div class="metric-head"><span>' + esc(area.metric.label) + ' today</span>' +
          '<b>' + (typeof cur === 'number' ? cur + '/10' : 'not set') + '</b></div>' +
          '<input type="range" min="0" max="10" step="1" value="' + (typeof cur === 'number' ? cur : 5) + '">' +
          '<div class="metric-head" style="margin:4px 0 0"><span>' + esc(area.metric.low || '0') + '</span><span>' + esc(area.metric.high || '10') + '</span></div>' +
          '</div>'
        );
        m.querySelector('input').addEventListener('input', function (e) {
          if (!S.metrics[t]) S.metrics[t] = {};
          S.metrics[t][area.id] = +e.target.value;
          m.querySelector('.metric-head b').textContent = e.target.value + '/10';
          save();
        });
        card.appendChild(m);
      }

      root.appendChild(card);
    });

    var note = el(
      '<div class="card"><div class="card-head"><div><h2>Note for today</h2>' +
      '<p class="sub">Anything you noticed — triggers, flare-ups, what helped.</p></div></div>' +
      '<textarea placeholder="e.g. ear was louder after the loud restaurant; knee felt solid on the stairs"></textarea></div>'
    );
    var ta = note.querySelector('textarea');
    ta.value = S.notes[t] || '';
    ta.addEventListener('change', function () { S.notes[t] = ta.value; save(); });
    root.appendChild(note);
  }

  function toggle(dayKey, actionId) {
    if (!S.log[dayKey]) S.log[dayKey] = {};
    if (S.log[dayKey][actionId]) delete S.log[dayKey][actionId];
    else S.log[dayKey][actionId] = true;
    save();
    render();
  }

  /* ---------------------------------------------------------- view: progress */

  function renderProgress() {
    var root = document.getElementById('view-progress');
    root.innerHTML = '';
    var days = week(), prev = prevWeek();

    var d14 = lastDays(14);
    var bars = el('<div class="card"><div class="card-head"><div><h2>Last 14 days</h2>' +
      '<p class="sub">How much of a normal day you covered, day by day.</p></div></div>' +
      '<div class="bars"></div><div class="bars-x"></div></div>');
    var barsEl = bars.querySelector('.bars'), xEl = bars.querySelector('.bars-x');
    d14.forEach(function (k) {
      var v = dayCompletion(k);
      var col = el('<div><span style="height:' + Math.round(Math.min(1, v) * 100) + '%"></span></div>');
      col.title = k + ' — ' + pct(Math.min(1, v)) + '%';
      if (k === today()) col.querySelector('span').style.opacity = '.75';
      barsEl.appendChild(col);
      xEl.appendChild(el('<span>' + weekdayShort(k) + '</span>'));
    });
    root.appendChild(bars);

    var tr = el('<div class="card"><div class="card-head"><div><h2>This week vs last</h2>' +
      '<p class="sub">Consistency in each area, and where the trend is heading.</p></div></div></div>');
    S.areas.forEach(function (a) {
      var now = areaScore(a, days), before = areaScore(a, prev);
      var d = pct(now) - pct(before);
      var cls = d > 2 ? 'up' : (d < -2 ? 'down' : 'flat');
      var sign = d > 0 ? '+' : '';
      tr.appendChild(el(
        '<div class="trend">' + ring(now, 42, 6, esc(a.color)) +
        '<div class="grow"><div class="name">' + esc(a.emoji) + ' ' + esc(a.name) + '</div>' +
        '<div class="desc">' + pct(before) + '% last week → ' + pct(now) + '% now</div></div>' +
        '<div class="delta ' + cls + '">' + sign + d + '%</div></div>'
      ));
    });
    if (!S.areas.length) tr.appendChild(el('<p class="empty">Nothing to compare yet.</p>'));
    root.appendChild(tr);

    var withMetric = S.areas.filter(function (a) { return a.metric && a.metric.label; });
    if (withMetric.length) {
      var mc = el('<div class="card"><div class="card-head"><div><h2>How it has felt</h2>' +
        '<p class="sub">Your daily ratings, last 14 days.</p></div></div></div>');
      withMetric.forEach(function (a) {
        var vals = d14.map(function (k) { return (S.metrics[k] || {})[a.id]; });
        var known = vals.filter(function (v) { return typeof v === 'number'; });
        var nowAvg = metricAvg(a.id, days), prevAvg = metricAvg(a.id, prev);
        var desc = 'no ratings yet', cls = 'flat', label = '—';
        if (nowAvg != null) {
          label = nowAvg.toFixed(1);
          desc = '7-day average out of 10';
          if (prevAvg != null) {
            var diff = nowAvg - prevAvg;
            var better = a.metric.lowerIsBetter ? diff < 0 : diff > 0;
            desc = prevAvg.toFixed(1) + ' → ' + nowAvg.toFixed(1) + (Math.abs(diff) < 0.2 ? ' · steady' : (better ? ' · better' : ' · worse'));
            cls = Math.abs(diff) < 0.2 ? 'flat' : (better ? 'up' : 'down');
          }
        }
        // gaps get carried forward so the line stays readable
        var filled = [], last = 5;
        vals.forEach(function (v) { if (typeof v === 'number') last = v; filled.push(last); });
        mc.appendChild(el(
          '<div class="trend"><div style="flex:none">' + (known.length ? sparkline(filled, esc(a.color), a.metric.lowerIsBetter) : '<div style="width:120px"></div>') + '</div>' +
          '<div class="grow"><div class="name">' + esc(a.metric.label) + '</div><div class="desc">' + esc(desc) + '</div></div>' +
          '<div class="delta ' + cls + '">' + label + '</div></div>'
        ));
      });
      root.appendChild(mc);
    }

    var recent = lastDays(7).slice().reverse().filter(function (k) { return (S.notes[k] || '').trim(); });
    if (recent.length) {
      var nc = el('<div class="card"><div class="card-head"><div><h2>Recent notes</h2></div></div></div>');
      recent.forEach(function (k) {
        nc.appendChild(el('<div class="trend"><div class="grow"><div class="desc">' + esc(k) + '</div>' +
          '<div class="name">' + esc(S.notes[k]) + '</div></div></div>'));
      });
      root.appendChild(nc);
    }
  }

  /* ------------------------------------------------------------ view: invest */

  function renderInvest() {
    var root = document.getElementById('view-invest');
    root.innerHTML = '';
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
      root.appendChild(el(
        '<div class="card"><div class="card-head"><div><h2>Where to put attention</h2>' +
        '<p class="sub">Lowest consistency over the last 7 days.</p></div></div>' +
        '<div class="trend" style="border-top:0">' + ring(areaScore(weakest, days), 42, 6, esc(weakest.color)) +
        '<div class="grow"><div class="name">' + esc(weakest.emoji) + ' ' + esc(weakest.name) + '</div>' +
        '<div class="desc">at ' + pct(areaScore(weakest, days)) + '% — one more rep this week moves it most</div></div></div>' +
        (strongest && strongest !== weakest ?
          '<p class="muted" style="margin:10px 0 0">Meanwhile ' + esc(strongest.name) + ' is holding at ' +
          pct(areaScore(strongest, days)) + '%. Keep that one on cruise.</p>' : '') +
        '</div>'
      ));
    }

    var card = el('<div class="card"><div class="card-head"><div><h2>Invest your coins</h2>' +
      '<p class="sub">Real things that move an area forward. Spend the coins when you book it.</p></div></div>' +
      '<div class="inv-list"></div></div>');
    var list = card.querySelector('.inv-list');

    S.investments.forEach(function (inv) {
      var area = S.areas.filter(function (a) { return a.id === inv.areaId; })[0];
      var row = el('<div class="inv"><div class="grow">' +
        '<div class="name">' + (inv.done ? '✅ ' : '') + esc(inv.name) + '</div>' +
        '<div class="why">' + (area ? esc(area.emoji) + ' ' + esc(area.name) : 'general') +
        (inv.done ? ' · invested' : '') + '</div></div>' +
        '<div class="cost">◎' + inv.cost + '</div></div>');
      if (!inv.done) {
        var b = el('<button class="btn' + (bal >= inv.cost ? ' primary' : '') + '"' + (bal >= inv.cost ? '' : ' disabled') + '>Invest</button>');
        b.addEventListener('click', function () {
          S.spent = (S.spent || 0) + inv.cost;
          inv.done = true;
          inv.doneAt = today();
          save(); render();
        });
        row.appendChild(b);
      } else {
        var u = el('<button class="btn ghost">Undo</button>');
        u.addEventListener('click', function () {
          S.spent = Math.max(0, (S.spent || 0) - inv.cost);
          inv.done = false; delete inv.doneAt;
          save(); render();
        });
        row.appendChild(u);
      }
      list.appendChild(row);
    });
    if (!S.investments.length) list.appendChild(el('<p class="empty">No investments yet — add one below.</p>'));

    var form = el('<div style="border-top:1px solid var(--line);margin-top:12px;padding-top:12px">' +
      '<label class="field"><span>New investment</span><input type="text" class="i-name" placeholder="e.g. new running shoes"></label>' +
      '<div class="grid2"><label class="field"><span>Cost in coins</span><input type="number" class="i-cost" value="300" min="0" step="10"></label>' +
      '<label class="field"><span>Area</span><select class="i-area"></select></label></div>' +
      '<button class="btn">Add investment</button></div>');
    var sel = form.querySelector('.i-area');
    S.areas.forEach(function (a) { sel.appendChild(el('<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>')); });
    sel.appendChild(el('<option value="">General</option>'));
    form.querySelector('button').addEventListener('click', function () {
      var name = form.querySelector('.i-name').value.trim();
      if (!name) return;
      S.investments.push({
        id: uid(), name: name,
        cost: Math.max(0, +form.querySelector('.i-cost').value || 0),
        areaId: sel.value, done: false
      });
      save(); render();
    });
    card.appendChild(form);
    root.appendChild(card);
  }

  /* ------------------------------------------------------------- view: areas */

  function renderAreas() {
    var root = document.getElementById('view-areas');
    root.innerHTML = '';

    root.appendChild(el('<div class="card"><div class="card-head"><div><h2>Your areas</h2>' +
      '<p class="sub">Rename, retune the weekly targets, or add whatever else you want to grow in. ' +
      'Coins are just how much a habit is worth to you.</p></div></div></div>'));

    S.areas.forEach(function (area, idx) {
      var card = el('<div class="card area" style="border-left-color:' + esc(area.color) + '"></div>');

      var head = el('<div class="row"><input type="text" class="w-emoji a-emoji" value="' + esc(area.emoji) + '" maxlength="3">' +
        '<input type="text" class="grow a-name" value="' + esc(area.name) + '"></div>');
      head.querySelector('.a-emoji').addEventListener('change', function (e) { area.emoji = e.target.value; save(); render(); });
      head.querySelector('.a-name').addEventListener('change', function (e) { area.name = e.target.value; save(); render(); });
      card.appendChild(head);

      var note = el('<label class="field" style="margin-top:10px"><span>Note to self</span>' +
        '<input type="text" class="a-note" value="' + esc(area.note || '') + '" placeholder="what is going on here"></label>');
      note.querySelector('input').addEventListener('change', function (e) { area.note = e.target.value; save(); });
      card.appendChild(note);

      var sw = el('<div class="swatches" style="margin-bottom:12px"></div>');
      PALETTE.forEach(function (c) {
        var b = el('<button class="swatch' + (c === area.color ? ' on' : '') + '" style="background:' + c + '" aria-label="colour"></button>');
        b.addEventListener('click', function () { area.color = c; save(); render(); });
        sw.appendChild(b);
      });
      card.appendChild(sw);

      card.appendChild(el('<h3 class="section" style="margin-top:4px">Habits · times per week · coins</h3>'));
      area.actions.forEach(function (act) {
        var row = el('<div class="row" style="margin-bottom:8px">' +
          '<input type="text" class="grow x-label" value="' + esc(act.label) + '">' +
          '<input type="number" class="w-target x-target" min="1" max="7" value="' + act.target + '">' +
          '<input type="number" class="w-coins x-coins" min="1" max="20" value="' + act.coins + '">' +
          '<button class="btn ghost x-del" title="remove habit">✕</button></div>');
        row.querySelector('.x-label').addEventListener('change', function (e) { act.label = e.target.value; save(); });
        row.querySelector('.x-target').addEventListener('change', function (e) {
          act.target = Math.max(1, Math.min(7, +e.target.value || 1)); save(); render();
        });
        row.querySelector('.x-coins').addEventListener('change', function (e) {
          act.coins = Math.max(1, +e.target.value || 1); save(); render();
        });
        row.querySelector('.x-del').addEventListener('click', function () {
          if (!confirm('Remove "' + act.label + '"? Past check-ins stay in your history.')) return;
          S.archive[act.id] = { coins: act.coins };
          area.actions = area.actions.filter(function (x) { return x.id !== act.id; });
          save(); render();
        });
        card.appendChild(row);
      });

      var add = el('<div class="row" style="margin-top:10px">' +
        '<input type="text" class="grow n-label" placeholder="add a habit…">' +
        '<button class="btn">Add</button></div>');
      add.querySelector('button').addEventListener('click', function () {
        var v = add.querySelector('.n-label').value.trim();
        if (!v) return;
        area.actions.push({ id: uid(), label: v, coins: 2, target: 5 });
        save(); render();
      });
      card.appendChild(add);

      var m = area.metric || (area.metric = { label: '', low: '', high: '', lowerIsBetter: false });
      var met = el('<div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px">' +
        '<h3 class="section" style="margin-top:0">Daily 0–10 rating (optional)</h3>' +
        '<label class="field"><span>What are you rating?</span><input type="text" class="m-label" value="' + esc(m.label) + '" placeholder="e.g. tinnitus loudness"></label>' +
        '<div class="grid2"><label class="field"><span>0 means…</span><input type="text" class="m-low" value="' + esc(m.low || '') + '"></label>' +
        '<label class="field"><span>10 means…</span><input type="text" class="m-high" value="' + esc(m.high || '') + '"></label></div>' +
        '<label class="chk"><input type="checkbox" class="m-lower"' + (m.lowerIsBetter ? ' checked' : '') + '> Lower is better</label></div>');
      met.querySelector('.m-label').addEventListener('change', function (e) { m.label = e.target.value; save(); render(); });
      met.querySelector('.m-low').addEventListener('change', function (e) { m.low = e.target.value; save(); });
      met.querySelector('.m-high').addEventListener('change', function (e) { m.high = e.target.value; save(); });
      met.querySelector('.m-lower').addEventListener('change', function (e) { m.lowerIsBetter = e.target.checked; save(); });
      card.appendChild(met);

      var tools = el('<div class="btnrow"></div>');
      if (idx > 0) {
        var up = el('<button class="btn ghost">↑ Move up</button>');
        up.addEventListener('click', function () {
          var a = S.areas.splice(idx, 1)[0]; S.areas.splice(idx - 1, 0, a); save(); render();
        });
        tools.appendChild(up);
      }
      var del = el('<button class="btn ghost">Delete area</button>');
      del.addEventListener('click', function () {
        if (!confirm('Delete "' + area.name + '" and its habits?')) return;
        area.actions.forEach(function (act) { S.archive[act.id] = { coins: act.coins }; });
        S.areas = S.areas.filter(function (x) { return x.id !== area.id; });
        save(); render();
      });
      tools.appendChild(del);
      card.appendChild(tools);

      root.appendChild(card);
    });

    var newArea = el('<div class="card"><div class="card-head"><div><h2>Add an area</h2>' +
      '<p class="sub">Sleep, back, nutrition, stress — whatever earns a ring.</p></div></div>' +
      '<div class="row"><input type="text" class="w-emoji na-emoji" value="🌱" maxlength="3">' +
      '<input type="text" class="grow na-name" placeholder="area name"></div>' +
      '<div class="btnrow"><button class="btn primary">Add area</button></div></div>');
    newArea.querySelector('button').addEventListener('click', function () {
      var name = newArea.querySelector('.na-name').value.trim();
      if (!name) return;
      S.areas.push({
        id: uid(), name: name, emoji: newArea.querySelector('.na-emoji').value || '🌱',
        color: PALETTE[S.areas.length % PALETTE.length], note: '',
        metric: { label: '', low: '', high: '', lowerIsBetter: false },
        actions: []
      });
      save(); render();
    });
    root.appendChild(newArea);

    var data = el('<div class="card"><div class="card-head"><div><h2>Your data</h2>' +
      '<p class="sub">Stored in this browser only. Export before you clear site data or switch phones.</p></div></div>' +
      '<div class="btnrow"><button class="btn d-export">Export backup</button>' +
      '<button class="btn d-import">Import backup</button>' +
      '<button class="btn ghost d-reset">Reset everything</button></div>' +
      '<input type="file" accept="application/json" class="d-file" hidden></div>');
    data.querySelector('.d-export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'growth-rings-' + today() + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
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
          save(); render();
        } catch (e) { alert('Could not read that file: ' + e.message); }
      };
      r.readAsText(f);
    });
    data.querySelector('.d-reset').addEventListener('click', function () {
      if (!confirm('Wipe all areas, history and coins, back to the starting setup?')) return;
      S = seed(); save(); render();
    });
    root.appendChild(data);
  }

  /* -------------------------------------------------------------- shell/tabs */

  function render() {
    document.getElementById('coinBalance').textContent = balance();
    document.getElementById('dateLine').textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    ['today', 'progress', 'invest', 'areas'].forEach(function (v) {
      document.getElementById('view-' + v).hidden = v !== S.view;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
      b.classList.toggle('is-active', b.dataset.view === S.view);
    });

    if (S.view === 'today') renderToday();
    else if (S.view === 'progress') renderProgress();
    else if (S.view === 'invest') renderInvest();
    else renderAreas();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
    b.addEventListener('click', function () {
      S.view = b.dataset.view; save(); render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  render();
})();
