/* ---- aviso de versión nueva (sin recargar sola, sin perder datos) ---- */
(function(){
  const meta=document.querySelector('meta[name="app-version"]');
  const mia=meta?meta.content.trim():'';
  if(!mia)return;
  let aviso=null;
  function verificar(){
    fetch('version.txt',{cache:'no-store'}).then(function(r){return r.ok?r.text():null}).then(function(t){
      if(!t)return;
      const viva=t.trim();
      if(!viva||viva===mia||aviso)return;
      aviso=document.createElement('div');
      aviso.id='updAviso';
      aviso.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:var(--green);color:#fff;padding:10px 14px;display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;font-size:13.5px;box-shadow:0 8px 24px rgba(15,39,28,.35);font-family:inherit';
      aviso.innerHTML='<svg class="ic ic-sm" style="color:var(--lime)"><use href="#i-replay"/></svg>'+
        '<span style="flex:1;min-width:220px;text-align:center"><b>Hay una versión nueva de TerraFleet.</b> Actualizá para ver los últimos cambios — no perdés nada de lo cargado.</span>'+
        '<button id="updBtn" style="background:var(--lime);color:var(--on-lime);border:0;border-radius:9px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13.5px">Actualizar ahora</button>';
      document.body.appendChild(aviso);
      document.getElementById('updBtn').onclick=function(){location.reload()};
      document.body.style.paddingTop=aviso.offsetHeight+'px';
    }).catch(function(){});
  }
  setTimeout(verificar,4000);
  setInterval(verificar,5*60*1000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)verificar()});
  window.addEventListener('focus',verificar);
  window.addEventListener('pageshow',function(e){if(e.persisted)verificar()});
})();

/* ---- app instalable y disponible sin señal ---- */
if('serviceWorker' in navigator&&location.protocol==='https:'){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
}
