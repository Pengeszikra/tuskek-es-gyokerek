// The spi3der film section: replays the Claude conversation that produced the film, then
// starts the story in the native spi3der player. Only presentation; the film is spi3der's own.
(() => {
  const log = document.getElementById('chat-log');
  const frame = document.getElementById('spi3der-movie-frame');
  const again = document.getElementById('chat-replay-again');
  if (!log || !frame) return;
  // [kind, english, hungarian] — the user lines are the owner's own requests from the chat
  const SCRIPT = [
    ['user', 'Is there a real 3D version of the official spider? Show it in spi3der.', 'Van a hivatalos póknak rendes 3D-s verziója? A spi3der-be mutasd meg.'],
    ['tool', 'build_model → open_workshop · 62 objects', 'build_model → open_workshop · 62 objektum'],
    ['ai', 'Here is the logo spider in 3D, open in the workshop.', 'Itt a logópók 3D-ben, nyitva a workshopban.'],
    ['user', 'Rig it — take off the thread, use spi3der’s mechanics.', 'Meg kellene riggelni, a fonalat leszedve róla, használd a spi3der mechanikáját.'],
    ['tool', 'connect · pivot / hinge × 24 · move_joint', 'connect · pivot / hinge × 24 · move_joint'],
    ['user', 'Give it some terrain to move on, with a box it can edit.', 'Csinálj neki egy kis terepet, legyen ott egy box, amit editálhat.'],
    ['tool', 'add_box · add_mesh · place_on', 'add_box · add_mesh · place_on'],
    ['user', 'I bevelled the body a little. Go for the animation.', 'Egy kis bevelt tettem a torra és a potrohra. Mehet az animáció.'],
    ['tool', 'build_story · tetrapod gait, 8 legs', 'build_story · tetrapod járás, 8 láb'],
    ['user', 'Now shape this model: Q E extrude, S size, alternating — that’s how I did it.', 'Alakítsa ki ezt a modelt: Q E extrude, S size felváltva, így csináltam.'],
    ['tool', 'extrude_face × 6 · move_vertices', 'extrude_face × 6 · move_vertices'],
    ['user', 'Then the full film: the spider shows how to work with bodies.', 'Akkor jöhet a teljes mozi: a pók mutatja be, hogyan kell dolgozni a testekkel.'],
    ['tool', 'build_story → open_workshop', 'build_story → open_workshop'],
    ['user', 'In the editor these operations are processes, not instant results. Animate them like that.', 'Amikor szerkesztem, a műveletek folyamatok, nem csak hopp, megvan az eredmény. Így kellene leanimálni.'],
    ['tool', 'build_story shapes · continuous morph · push main → Cloud Run', 'build_story shapes · folyamatos morph · push main → Cloud Run'],
    ['ai', 'Done: extrusions now grow and faces scale smoothly. Watch it on the right →', 'Kész: a kihúzás most kinő, a méretezés folyamatosan szűkít. Nézd jobb oldalt →'],
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => (document.documentElement.lang === 'hu' ? 'hu' : 'en');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let run = 0;
  const nodes = [];
  const relabel = () => nodes.forEach(({ el, text, line }) => {
    if (el.dataset.done) text.textContent = line[lang() === 'hu' ? 2 : 1];
  });
  new MutationObserver(relabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  const startBtn = document.getElementById('spi3der-movie-start');
  const startFilm = () => { if (!frame.getAttribute('src')) frame.src = frame.dataset.src; if (startBtn) startBtn.hidden = true; };
  startBtn?.addEventListener('click', startFilm);
  async function play() {
    const me = ++run;
    log.textContent = '';
    nodes.length = 0;
    for (let line of SCRIPT) {
      if (me !== run) return;
      const [kind] = line;
      const el = document.createElement('div');
      el.className = kind === 'tool' ? 'chat-tool' : `chat-msg chat-${kind}`;
      if (kind === 'ai') { const who = document.createElement('span'); who.className = 'who'; who.textContent = 'CLAUDE'; el.append(who); }
      const text = document.createElement('span');
      el.append(text);
      log.append(el);
      nodes.push({ el, text, line });
      requestAnimationFrame(() => el.classList.add('on'));
      const full = line[lang() === 'hu' ? 2 : 1];
      if (reduce || kind === 'tool') {
        text.textContent = (kind === 'tool' ? '⚙ ' : '') + full;
        if (kind === 'tool') line = nodes.at(-1).line = [kind, '⚙ ' + line[1], '⚙ ' + line[2]];
      } else {
        text.classList.add('chat-caret');
        for (let i = 1; i <= full.length; i += kind === 'user' ? 2 : 3) {
          if (me !== run) return;
          text.textContent = full.slice(0, i);
          log.scrollTop = log.scrollHeight;
          await wait(18);
        }
        text.textContent = full;
        text.classList.remove('chat-caret');
      }
      el.dataset.done = '1';
      log.scrollTop = log.scrollHeight;
      if (!reduce) await wait(kind === 'tool' ? 520 : kind === 'user' ? 380 : 650);
    }
    startFilm();
  }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
  }, { threshold: 0.35 });
  io.observe(log);
  again?.addEventListener('click', () => play());
})();
