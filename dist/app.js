const buttons = document.querySelectorAll('[data-lang]');
let language = new URLSearchParams(location.search).get('lang') === 'hu' ? 'hu' : 'en';
function setLanguage(lang) {
 language = lang;
 document.documentElement.lang = lang;
 document.querySelectorAll('[data-en]').forEach(el => { el.innerHTML = el.dataset[lang]; });
 buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
 const url = new URL(location.href);
 url.searchParams.set('lang', lang);
 history.replaceState(null, '', url);
 document.title = lang === 'hu' ? 'Tüskék és Gyökerek — A gyökerektől az univerzumig' : 'Tüskék és Gyökerek — From roots to the universe';
 document.getElementById('copied').textContent = '';
}
buttons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
setLanguage(language);
document.getElementById('copy').addEventListener('click', async () => {
 const status = document.getElementById('copied');
 try { await navigator.clipboard.writeText(document.querySelector('.connect code').textContent); status.textContent = language === 'hu' ? 'Kimásolva.' : 'Copied.'; }
 catch { status.textContent = language === 'hu' ? 'Jelöld ki és másold a fenti parancsot.' : 'Select and copy the command above.'; }
});
function updateProgress() {
 const total = document.documentElement.scrollHeight - innerHeight;
 document.getElementById('progress').style.width = `${total > 0 ? scrollY / total * 100 : 0}%`;
}
addEventListener('scroll', updateProgress, {passive:true});
addEventListener('resize', updateProgress);
updateProgress();
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
