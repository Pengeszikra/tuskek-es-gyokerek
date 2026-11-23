// Shared by every page: EN/HU switch, language-preserving links, scroll
// progress, lazy YouTube players, the DEV journal and the sandbox terminal.
// Each feature only runs when its markup is on the page.
const buttons = document.querySelectorAll('[data-lang]');
const body = document.body;
let language = new URLSearchParams(location.search).get('lang') === 'hu' ? 'hu' : 'en';

function setLanguage(lang) {
 language = lang;
 document.documentElement.lang = lang;
 document.querySelectorAll('[data-en]').forEach(el => { el.innerHTML = el.dataset[lang]; });
 document.querySelectorAll('[data-aria-en]').forEach(el => el.setAttribute('aria-label', el.dataset[lang === 'hu' ? 'ariaHu' : 'ariaEn']));
 buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
 document.querySelectorAll('[data-lang-link]').forEach(link => {
  const dest = new URL(link.dataset.langLink, location.href);
  dest.searchParams.set('lang', lang);
  link.href = dest.pathname.split('/').pop() + dest.search + dest.hash;
 });
 const url = new URL(location.href);
 url.searchParams.set('lang', lang);
 history.replaceState(null, '', url);
 if (body.dataset.titleEn) document.title = lang === 'hu' ? body.dataset.titleHu : body.dataset.titleEn;
}
buttons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
setLanguage(language);

function updateProgress() {
 const bar = document.getElementById('progress');
 if (!bar) return;
 const total = document.documentElement.scrollHeight - innerHeight;
 bar.style.width = `${total > 0 ? scrollY / total * 100 : 0}%`;
}
addEventListener('scroll', updateProgress, {passive:true});
addEventListener('resize', updateProgress);
updateProgress();

// Click-to-play YouTube: a thumbnail first, the player only after a click.
document.querySelectorAll('.yt[data-id]').forEach(el => {
 const id = el.dataset.id;
 if (!el.querySelector('img')) {
  const img = document.createElement('img');
  img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  img.alt = '';
  img.loading = 'lazy';
  el.prepend(img);
 }
 el.addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  iframe.title = el.getAttribute('aria-label') || 'YouTube video';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  el.replaceChildren(iframe);
  el.classList.add('playing');
 }, {once:true});
});

// Latest public posts from the same DEV account as the RSS feed.
const feedList = document.getElementById('feed-list');
if (feedList) {
 fetch('https://dev.to/api/articles?username=pengeszikra&per_page=4', {headers:{Accept:'application/vnd.forem.api-v1+json'}})
  .then(r => { if (!r.ok) throw Error(String(r.status)); return r.json(); })
  .then(posts => {
   if (!Array.isArray(posts) || !posts.length) throw Error('empty feed');
   feedList.replaceChildren(...posts.map(post => {
    const article = document.createElement('article');
    const a = document.createElement('a');
    a.href = post.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const title = document.createElement('h3');
    title.textContent = post.title;
    const meta = document.createElement('small');
    meta.textContent = new Date(post.published_at).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', {year:'numeric',month:'short',day:'numeric'});
    a.append(title, meta);
    article.append(a);
    return article;
   }));
  })
  .catch(() => {
   feedList.textContent = language === 'hu' ? 'A cikkek most nem tölthetők be. Nyisd meg az RSS feedet alább.' : 'Posts are unavailable right now. Open the RSS feed below.';
  });
}

// Copy buttons: <button data-copy="#selector">
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
 const source = document.querySelector(button.dataset.copy);
 const label = button.textContent;
 try { await navigator.clipboard.writeText(source.textContent.trim()); button.textContent = language === 'hu' ? 'Kimásolva ✓' : 'Copied ✓'; }
 catch { button.textContent = language === 'hu' ? 'Jelöld ki és másold' : 'Select and copy'; }
 setTimeout(() => { button.textContent = label; }, 1800);
}));

const terminalLaunch = document.getElementById('terminal-launch');
terminalLaunch?.addEventListener('click', () => {
 const host = document.getElementById('workshop-terminal-frame');
 const iframe = document.createElement('iframe');
 iframe.src = 'https://terminal-is-your-friend.vercel.app/';
 iframe.title = 'Terminal Is Your Friend — TS/JS/TSX Sandbox Terminal with AI mentor';
 iframe.allow = 'clipboard-read; clipboard-write';
 host.replaceChildren(iframe);
 host.hidden = false;
 terminalLaunch.setAttribute('aria-expanded', 'true');
 terminalLaunch.hidden = true;
});
