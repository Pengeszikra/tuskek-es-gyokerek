// The spi3der film page: replays, in a Claude-chat look, the conversation that produced the film.
// Each request is typed into the composer and sent; tool calls run; the last answer opens the film
// in the native spi3der player, inline, the way it first appeared in the chat.
(() => {
  const log = document.getElementById('cc-log');
  const input = document.getElementById('cc-input');
  const send = document.getElementById('cc-send');
  const replay = document.getElementById('cc-replay');
  if (!log || !input) return;
  const FILM = 'https://spi3der.cloud.run/player.html?scene=/models/spi3der-sculpt.build.json&autoplay=1&loop=1';
  // [kind, english, hungarian]; the user lines are the owner's own requests from the conversation
  const SCRIPT = [
    ['user', 'Is there a real 3D version of the official spider? Show it in spi3der.', 'Van a hivatalos póknak rendes 3D-s verziója? A spi3der-be mutasd meg.'],
    ['tool', 'build_model · 62 objects', 'build_model · 62 objektum'],
    ['ai', 'There is now: I built the logo spider from its parts — body, eyes, the cyan rings, eight legs — and opened it in the workshop.', 'Most már van: alkatrészenként felépítettem a logópókot — test, szemek, türkiz gyűrűk, nyolc láb —, és megnyitottam a workshopban.'],
    ['user', 'The plan is to rig it, with the thread taken off. spi3der has mechanics too, you could use that.', 'A terv az, hogy meg kellene riggelni, a fonalat leszedve róla. A spi3der mechanikát is tartalmaz, esetleg azt is használhatod.'],
    ['tool', 'connect · 24 pivot / hinge joints · move_joint', 'connect · 24 pivot / hinge ízület · move_joint'],
    ['ai', 'Rigged: every leg has a hip pivot, a knee and an ankle hinge, all held by the head, so moving the head carries the whole spider.', 'Riggelve: minden lábon csípő-pivot, térd- és bokazsanér, mind a fejhez kötve, így a fejjel együtt mozog az egész pók.'],
    ['user', 'Make it a little terrain to move on, with a box there that it can edit.', 'Csinálj neki egy kis terepet, ahol mozoghat, legyen ott egy box, amit editálhat.'],
    ['tool', 'add_box · add_mesh · place_on', 'add_box · add_mesh · place_on'],
    ['user', 'I put a small bevel on the bottom of the body and the abdomen too. The animation can go.', 'Egy kis bevelt tettem a tor és a potroh aljára is. Mehet az animáció.'],
    ['tool', 'build_story · tetrapod gait, 8 legs', 'build_story · tetrapod járás, 8 láb'],
    ['user', 'Great — now let it shape this model: Q E extrude, S size, alternating. That’s how I did it.', 'Szuper, alakítsa ki ezt a modelt: Q E extrude, S size felváltva, így csináltam.'],
    ['tool', 'extrude_face × 6 · move_vertices', 'extrude_face × 6 · move_vertices'],
    ['user', 'Then the full film: the spider shows how to work with bodies.', 'Akkor jöhet a teljes mozi: a pók mutatja be, hogyan kell dolgozni a testekkel.'],
    ['tool', 'build_story → open_workshop', 'build_story → open_workshop'],
    ['user', 'When I edit the model, the operations are processes — not just “pop, there’s the result”. That’s how it should be animated.', 'Amikor szerkesztem a modellt, a műveletek folyamatok, nem csak hopp, megvan az eredmény. Így kellene leanimálni.'],
    ['tool', 'build_story · shapes, continuous morph', 'build_story · shapes, folyamatos morph'],
    ['film', 'Now each operation is a process: the extrusion grows out of its face, the scale narrows the rim smoothly. Here it is:', 'Most már minden művelet folyamat: a kihúzás kinő a lapból, a méretezés folyamatosan szűkíti a peremet. Itt van:'],
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => (document.documentElement.lang === 'hu' ? 'hu' : 'en');
  const pick = (line) => line[lang() === 'hu' ? 2 : 1];
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const shown = []; // [element to relabel, line]
  let run = 0;
  const placeholder = () => (input.dataset.placeholder = lang() === 'hu' ? 'Válasz Claude-nak…' : 'Reply to Claude…');
  const relabel = () => {
    placeholder();
    for (const [el, line] of shown) el.textContent = pick(line);
  };
  new MutationObserver(relabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  placeholder();
  const add = (el) => {
    el.classList.add('cc-in');
    log.append(el);
    requestAnimationFrame(() => el.classList.add('on'));
    log.scrollTop = log.scrollHeight;
  };
  async function typeInto(el, text, me, step, ms) {
    for (let i = 0; i <= text.length; i += step) {
      if (me !== run) return false;
      el.textContent = text.slice(0, i);
      log.scrollTop = log.scrollHeight;
      await wait(ms);
    }
    el.textContent = text;
    return true;
  }
  async function play() {
    const me = ++run;
    log.textContent = '';
    shown.length = 0;
    input.textContent = '';
    for (const line of SCRIPT) {
      if (me !== run) return;
      const kind = line[0];
      if (kind === 'user') {
        // typed into the composer, then sent
        input.classList.add('caret');
        if (!(await typeInto(input, pick(line), me, 2, 22))) return;
        send.classList.add('ready');
        await wait(350);
        input.classList.remove('caret');
        input.textContent = '';
        send.classList.remove('ready');
        const el = document.createElement('div');
        el.className = 'cc-user';
        el.textContent = pick(line);
        shown.push([el, line]);
        add(el);
        await wait(500);
      } else if (kind === 'tool') {
        const el = document.createElement('div');
        el.className = 'cc-tool busy';
        const icon = document.createElement('i');
        const label = document.createElement('span');
        const b = document.createElement('b');
        b.textContent = 'spi3der';
        label.append(b, ' · ');
        const what = document.createElement('span');
        what.textContent = pick(line);
        label.append(what);
        el.append(icon, label);
        shown.push([what, line]);
        add(el);
        await wait(1100);
        el.classList.remove('busy');
        await wait(250);
      } else {
        const el = document.createElement('div');
        el.className = 'cc-ai';
        const p = document.createElement('div');
        el.append(p);
        add(el);
        if (!(await typeInto(p, pick(line), me, 3, 16))) return;
        shown.push([p, line]);
        if (kind === 'film') {
          const card = document.createElement('div');
          card.className = 'cc-widget';
          const head = document.createElement('div');
          head.className = 'cc-widget-head';
          head.innerHTML = '<i></i><span>spi3der · open_workshop</span>';
          const frame = document.createElement('iframe');
          frame.title = 'spi3der story: the spider sculpts a box with extrude and scale';
          frame.allow = 'fullscreen';
          frame.referrerPolicy = 'strict-origin-when-cross-origin';
          frame.src = FILM;
          card.append(head, frame);
          el.append(card);
          setTimeout(() => (log.scrollTop = log.scrollHeight), 60);
        }
        await wait(700);
      }
    }
  }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      play();
    }
  }, { threshold: 0.3 });
  io.observe(log);
  replay?.addEventListener('click', () => play());
})();
