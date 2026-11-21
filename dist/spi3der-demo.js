// Public site demo: only prepares the saved scene URL.
// All modelling, rendering, editor panels and shortcuts belong to native spi3der.
const HOST='https://spi3der.cloud.run/';
const sceneFile='assets/spi3der-spider.scene.json';
const frame=document.getElementById('spi3der-demo-frame');
const status=document.getElementById('spi3der-demo-status');
const fullLink=document.getElementById('spi3der-demo-full');
const fallback=document.getElementById('spi3der-demo-fallback');
let ready=false;

const say=(en,hu)=>{
  status.dataset.en=en;
  status.dataset.hu=hu;
  status.textContent=document.documentElement.lang==='hu'?hu:en;
};

async function compressedFragment(scene){
  if(typeof CompressionStream!=='function') throw new Error('CompressionStream is unavailable');
  const bytes=new TextEncoder().encode(JSON.stringify(scene));
  const compressed=new Uint8Array(await new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  ).arrayBuffer());
  let binary='';
  for(let i=0;i<compressed.length;i+=8192)
    binary+=String.fromCharCode(...compressed.subarray(i,i+8192));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

window.addEventListener('message',event=>{
  if(event.origin!==new URL(HOST).origin||event.source!==frame.contentWindow)return;
  const data=event.data;
  if(data?.source!=='spi3der-native')return;
  if(data.phase==='native_scene_loaded'){
    ready=true;
    say('Drag to orbit · scroll to zoom · use the native controls',
        'Egérhúzással forgatható · görgetéssel nagyítható · natív vezérlők');
  }else if(data.phase==='native_scene_error'){
    say('The embedded editor could not load the spider scene.',
        'A beágyazott szerkesztő nem tudta betölteni a pók jelenetét.');
  }
});

async function openSpider(){
  try{
    say('Preparing the spider scene…','A pók jelenetének előkészítése…');
    const response=await fetch(sceneFile,{cache:'no-cache'});
    if(!response.ok)throw new Error('Scene HTTP '+response.status);
    const scene=await response.json();
    if(scene.format!=='3draft-scene'||!Array.isArray(scene.objects)||scene.objects.length<10)
      throw new Error('Invalid spi3der scene');
    const packed=await compressedFragment(scene);
    if(packed.length>1800000)throw new Error('Compressed scene is too large');
    const target=HOST+'?workshop=1#scene='+packed;
    frame.src=target;fullLink.href=target;
    say('Loading the native spi3der editor…','A natív spi3der szerkesztő betöltése…');
  }catch(error){
    console.error('[Tüskék és Gyökerek] spi3der demo:',error);
    frame.hidden=true;
    fallback.hidden=false;
    fullLink.href=HOST;
    say('The embedded demo is unavailable in this browser. Open spi3der directly or download the scene.',
        'A beágyazott bemutató ebben a böngészőben nem érhető el. Nyisd meg a spi3dert, vagy töltsd le a jelenetet.');
  }
}
openSpider();
