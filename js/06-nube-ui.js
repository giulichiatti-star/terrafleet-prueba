/* ================= NUBE (Supabase) =================
   Sin cuenta: la app funciona como siempre, con datos en este navegador (demo).
   Con cuenta: los datos se bajan de la nube y cada guardado sube solo las diferencias.
   La lógica de datos vive en nube.js (probada aparte); acá va solo la pantalla. */
const NUBE_URL='https://gytxfmjqfmcbetwxchlh.supabase.co';
const NUBE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dHhmbWpxZm1jYmV0d3hjaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMzkwNDUsImV4cCI6MjEwOTkxNTA0NX0.WqU1cqa95HhMpGiU1_BYyp08OmH364ONomIfE73nrZk'; /* clave pública: la seguridad la impone la base (RLS) */
Object.assign(NUBE,{
  sb:null,prof:null,state:null,sig:'',dirty:false,busy:false,timer:null,entering:false,recovering:false,mode:'login',
  status(txt,bad){$('#footStatus').textContent=txt;$('#footDot').classList.toggle('red',!!bad)},
  queue(){
    this.dirty=true;clearTimeout(this.timer);
    this.timer=setTimeout(()=>this.flush(),500);
    this.status('Guardando…');
  },
  async flush(){
    if(!this.on)return;
    if(this.busy){this.dirty=true;return}
    this.busy=true;this.dirty=false;
    this.saveCache(); /* primero a la copia local: si se corta la señal o se cierra la pestaña, no se pierde */
    let r;
    try{r=await TFNube.push(this.sb,db,this.state)}catch(e){r={ok:false,error:e,rejected:[],conflict:false}}
    this.busy=false;
    if(r.ok){
      this.sig=TFNube.signature(this.state.snap);
      this.saveCache();
      if(this.dirty)this.queue();else this.status('En la nube · todo guardado');
      return;
    }
    if(r.conflict||r.rejected.length){
      await this.reload(true);
      toast(r.conflict?'Otra persona modificó esos datos recién. Actualizamos la pantalla: revisá y repetí tu cambio.':'La nube no aceptó ese cambio. Restauramos lo último guardado.');
      return;
    }
    this.dirty=true;
    this.status('Sin conexión — tus cambios están guardados en este equipo y se suben solos al volver la señal.',true);
    clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),8000);
  },
  uiBusy(){
    if(document.querySelector('.modal-backdrop.show,.overlay:not(.off),#notifPop.show,#mobileMenu.show'))return true;
    const a=document.activeElement;
    /* escribiendo en un campo visible: no refrescar la pantalla debajo */
    return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.offsetParent!==null);
  },
  /* Trae lo que hayan cambiado otros. Nunca pisa cambios propios sin subir, salvo force. */
  async reload(force){
    if(!this.on||this.busy)return;
    if(!force&&(this.dirty||this.uiBusy()||TFNube.pending(db,this.state)))return;
    try{
      const x=await TFNube.load(this.sb,this.prof);
      if(!force&&(this.dirty||this.busy||this.uiBusy()))return;
      if(force||x.sig!==this.sig){
        clearTimeout(this.timer);this.dirty=false;
        db=x.db;this.state=x.state;this.sig=x.sig;
        db.meta.invSeq=db.meta.invSeq||0;
        recomputeStages(true);renderAll();
        if(typeof TFPro!=='undefined')TFPro.applyBrand();
        this.saveCache();
      }
      if(!this.dirty)this.status('En la nube · todo guardado');
    }catch(e){if(!this.dirty)this.status('Sin conexión — viendo la última copia guardada',true)}
  },
  async enter(){
    if(this.on||this.entering)return;
    this.entering=true;this.show('cargando');
    let prof=null,x=null,offline=false;
    try{
      prof=await TFNube.profile(this.sb);
      if(!prof){this.entering=false;this.show('sinperfil');return}
      x=await TFNube.load(this.sb,prof);
    }catch(e){
      /* sin señal: se abre con la última copia guardada en este equipo */
      const c=this.readCache();
      if(!c){this.entering=false;this.show('login');this.msg('No pudimos cargar tus datos. Revisá la conexión y probá de nuevo.');return}
      prof=c.prof;x={db:c.db,state:TFNube.unpack(c.state)};x.sig=TFNube.signature(x.state.snap);offline=true;
    }
    try{
      const local=db;
      const hayLocal=(local.clients||[]).length>0;
      const nubeVacia=!x.db.clients.length&&!x.db.machines.length&&!x.db.ots.length;
      /* ¿hay datos de este navegador para ofrecer subir? Se pregunta dentro de la app, una sola vez
         (un confirm() del navegador congelaba la pestaña y volvía a aparecer en cada carga). */
      let ofrecer=null;
      try{
        if(!offline&&prof.role==='admin'&&nubeVacia&&hayLocal&&localStorage.getItem('tf_subida_'+prof.agency_id)!=='no')ofrecer=JSON.parse(JSON.stringify(local));
      }catch(e){}
      this.prof=prof;this.state=x.state;this.sig=x.sig;
      db=x.db;
      this.on=true;this.entering=false;
      document.body.classList.add('nube');
      $('#welcomeOverlay').classList.add('off');hideLogin();
      $('#footUser').textContent=prof.email||'';
      $('#btnNube').textContent='Cerrar sesión';
      machFilter='all';
      APP.switchRole(prof.role==='cliente'?'client':'admin');
      if(prof.role!=='cliente'){const n=(prof.full_name||prof.email||'?').replace(/@.*/,'');$('#avatar').textContent=n.slice(0,2).toUpperCase()}
      recomputeStages(true);renderAll();
      this.show(null);
      tfFlushErrors();
      if(typeof TFPro!=='undefined')TFPro.afterEnter();
      if(typeof TFTec!=='undefined')TFTec.apply();
      if(offline){
        this.status('Sin conexión — viendo la última copia guardada. Los cambios se suben al volver la señal.',true);
        if(TFNube.pending(db,this.state))this.queue();
      }else{
        this.saveCache();
        if(!this.dirty)this.status('En la nube · todo guardado');
      }
      window.addEventListener('online',()=>{if(this.dirty||TFNube.pending(db,this.state))this.flush();else this.reload(false)});
      window.addEventListener('pagehide',()=>this.saveCache());
      if(ofrecer)this.ofrecerSubida(ofrecer);
      setInterval(()=>this.reload(false),45000);
      window.addEventListener('focus',()=>this.reload(false));
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.reload(false)});
      window.addEventListener('beforeunload',e=>{if(this.dirty||this.busy){e.preventDefault();e.returnValue=''}});
    }catch(e){
      this.entering=false;this.show('login');
      this.msg('No pudimos cargar tus datos. Revisá la conexión y probá de nuevo.');
    }
  },
  /* Ofrece pasar a la nube lo que estaba cargado en este navegador (modo demo). */
  ofrecerSubida(local){
    this._local=local;
    let m=document.getElementById('mSubida');
    if(!m){
      m=document.createElement('div');m.className='modal-backdrop';m.id='mSubida';
      m.innerHTML='<div class="modal"><h3>¿Subir los datos de este navegador?</h3><p id="mSubidaTxt"></p>'+
        '<div class="notice"><svg class="ic"><use href="#i-bulb"/></svg><div>Si eran datos de prueba, elegí <b>Empezar vacío</b>. No se borran de este navegador: siguen ahí al cerrar sesión.</div></div>'+
        '<div class="modal-actions"><button class="outline-btn" onclick="NUBE.responderSubida(false)">Empezar vacío</button><button class="solid-btn" onclick="NUBE.responderSubida(true)">Subir a la nube</button></div></div>';
      document.body.appendChild(m);
    }
    document.getElementById('mSubidaTxt').textContent='Antes de ingresar, en este navegador había '+local.clients.length+' clientes, '+local.machines.length+' máquinas y '+local.ots.length+' órdenes. La nube de '+db.meta.biz.name+' está vacía.';
    m.classList.add('show');
  },
  responderSubida(si){
    const local=this._local;this._local=null;
    document.getElementById('mSubida').classList.remove('show');
    if(!si||!local){try{localStorage.setItem('tf_subida_'+this.prof.agency_id,'no')}catch(e){}return}
    if(db.clients.length||db.machines.length||db.ots.length){toast('La nube ya tiene datos: no se sube para no mezclar');return}
    const d=local;
    d.session={clientId:null};
    d.machines.forEach(m=>{delete m.foto});
    d.meta=Object.assign({},d.meta,db.meta,{biz:db.meta.biz,seenWelcome:true,
      otSeq:Math.max(d.meta.otSeq||0,db.meta.otSeq||0),satSeq:Math.max(d.meta.satSeq||0,db.meta.satSeq||0),invSeq:Math.max(d.meta.invSeq||0,db.meta.invSeq||0)});
    db=d;
    recomputeStages(true);renderAll();
    toast('Subiendo tus datos a la nube…');
  },
  /* Copia local para trabajar sin señal. Solo vale si la sesión guardada es de la misma persona. */
  CACHE_KEY:'terrafleet_nube_copia',
  tokenUid(){
    try{const t=JSON.parse(localStorage.getItem('sb-'+NUBE_URL.split('//')[1].split('.')[0]+'-auth-token')||'null');return t&&t.user?t.user.id:null}catch(e){return null}
  },
  saveCache(){
    if(!this.on||!this.prof)return;
    try{localStorage.setItem(this.CACHE_KEY,JSON.stringify({uid:this.prof.user_id,prof:this.prof,db:db,state:TFNube.pack(this.state),ts:Date.now()}))}
    catch(e){try{localStorage.removeItem(this.CACHE_KEY)}catch(e2){}}
  },
  readCache(){
    try{
      const c=JSON.parse(localStorage.getItem(this.CACHE_KEY)||'null');
      const uid=this.tokenUid();
      return (c&&c.uid&&uid&&c.uid===uid&&c.db&&c.state)?c:null;
    }catch(e){return null}
  },
  msg(t,ok){const m=$('#nbMsg');m.textContent=t||'';m.classList.toggle('nb-ok',!!ok)},
  show(mode){
    const ov=$('#nubeOverlay');
    if(!mode){ov.classList.add('off');return}
    this.mode=mode;this.msg('');
    const T={
      login:['Ingresar','Entrá con tu cuenta para trabajar con los datos de tu agencia, guardados en la nube.','Ingresar'],
      signup:['Crear mi cuenta','Usá el email con el que te invitó la agencia y elegí una contraseña de 8 caracteres o más. Te va a llegar un correo para confirmar.','Crear cuenta'],
      reset:['Recuperar contraseña','Escribí tu email y te mandamos un enlace para elegir una contraseña nueva.','Enviar enlace'],
      newpass:['Elegí tu contraseña nueva','Escribí la contraseña nueva (8 caracteres o más).','Guardar contraseña'],
      sinperfil:['Tu cuenta todavía no tiene acceso','Esta cuenta no está vinculada a ninguna agencia. Pedile a la agencia que te invite con este mismo email y volvé a ingresar.',''],
      cargando:['Cargando tus datos…','Un momento.','']
    }[mode];
    $('#nbTitle').textContent=T[0];$('#nbText').textContent=T[1];
    $('#nbGo').textContent=T[2];$('#nbGo').disabled=false;
    $('#nbForm').style.display=T[2]?'block':'none';
    $('#nbEmailBox').style.display=(mode==='newpass')?'none':'block';
    $('#nbPassBox').style.display=(mode==='reset')?'none':'block';
    $('#nbPassL').textContent=mode==='newpass'?'Contraseña nueva':'Contraseña';
    $('#nbPass').autocomplete=(mode==='login')?'current-password':'new-password';
    $('#nbPass').value='';
    const L=[];
    if(mode==='login')L.push(['signup','Crear mi cuenta'],['reset','Olvidé mi contraseña'],['demo','Seguir sin cuenta (demo)']);
    if(mode==='signup'||mode==='reset')L.push(['login','Ya tengo cuenta'],['demo','Seguir sin cuenta (demo)']);
    if(mode==='sinperfil')L.push(['salir','Cerrar sesión']);
    $('#nbLinks').innerHTML=L.map(l=>'<a data-nb="'+l[0]+'">'+l[1]+'</a>').join('');
    ov.classList.remove('off');
    if(T[2])setTimeout(()=>{try{(mode==='newpass'?$('#nbPass'):$('#nbEmail')).focus()}catch(e){}},50);
  },
  async submit(){
    const email=$('#nbEmail').value.trim().toLowerCase(),pass=$('#nbPass').value,mode=this.mode;
    const here=location.origin+location.pathname;
    if(mode!=='newpass'&&!/^\S+@\S+\.\S+$/.test(email)){this.msg('Escribí un email válido.');return}
    if(mode!=='reset'&&pass.length<8){this.msg('La contraseña tiene que tener 8 caracteres o más.');return}
    $('#nbGo').disabled=true;this.msg('Un momento…',true);
    try{
      if(mode==='login'){
        const r=await this.sb.auth.signInWithPassword({email:email,password:pass});
        if(r.error){this.msg(/confirm/i.test(r.error.message)?'Todavía no confirmaste tu email: abrí el correo que te enviamos y tocá el enlace.':'Email o contraseña incorrectos.');$('#nbGo').disabled=false;return}
        await this.enter();
      }else if(mode==='signup'){
        const r=await this.sb.auth.signUp({email:email,password:pass,options:{emailRedirectTo:here}});
        if(r.error){this.msg('No se pudo crear la cuenta: '+r.error.message);$('#nbGo').disabled=false;return}
        if(r.data&&r.data.session){await this.enter();return}
        this.show('login');$('#nbEmail').value=email;
        this.msg('Listo. Te enviamos un correo a '+email+': abrilo y tocá el enlace para confirmar. Después ingresá acá.',true);
      }else if(mode==='reset'){
        const r=await this.sb.auth.resetPasswordForEmail(email,{redirectTo:here});
        if(r.error){this.msg('No se pudo enviar: '+r.error.message);$('#nbGo').disabled=false;return}
        this.show('login');$('#nbEmail').value=email;
        this.msg('Si ese email tiene cuenta, en unos minutos llega el enlace para cambiar la contraseña.',true);
      }else if(mode==='newpass'){
        const r=await this.sb.auth.updateUser({password:pass});
        if(r.error){this.msg('No se pudo guardar: '+r.error.message);$('#nbGo').disabled=false;return}
        this.recovering=false;toast('Contraseña guardada ✓');
        await this.enter();
      }
    }catch(e){this.msg('Sin conexión. Probá de nuevo.');$('#nbGo').disabled=false}
  },
  async salir(){
    if(this.dirty||this.busy){if(!confirm('Todavía hay cambios subiéndose a la nube. Si salís ahora se pueden perder. ¿Salir igual?'))return}
    this.dirty=false;this.busy=false;
    try{localStorage.removeItem(this.CACHE_KEY)}catch(e){}
    try{await this.sb.auth.signOut()}catch(e){}
    location.reload();
  },
  init(){
    if(this.sb||!window.supabase||!window.TFNube)return; /* sin librería: queda el modo demo */
    try{this.sb=window.supabase.createClient(NUBE_URL,NUBE_KEY)}catch(e){return}
    tfFlushErrors();
    const btn=$('#btnNube');btn.style.display='block';
    btn.addEventListener('click',()=>{if(this.on)this.salir();else this.show('login')});
    $('#nbForm').addEventListener('submit',e=>{e.preventDefault();this.submit()});
    $('#nbLinks').addEventListener('click',e=>{
      const k=e.target&&e.target.dataset?e.target.dataset.nb:null;if(!k)return;
      if(k==='demo')this.show(null);else if(k==='salir')this.salir();else this.show(k);
    });
    this.sb.auth.onAuthStateChange((ev,session)=>{
      /* no llamar a supabase dentro de este callback: se difiere */
      if(ev==='PASSWORD_RECOVERY'){this.recovering=true;setTimeout(()=>this.show('newpass'),0);return}
      if((ev==='INITIAL_SESSION'||ev==='SIGNED_IN')&&session&&!this.on&&!this.recovering)setTimeout(()=>this.enter(),0);
      /* sin señal y con la sesión vencida no llega sesión: si hay copia local de esta persona, se abre igual */
      if(ev==='INITIAL_SESSION'&&!session&&!this.on&&this.readCache())setTimeout(()=>this.enter(),0);
      if(ev==='SIGNED_OUT'&&this.on)setTimeout(()=>location.reload(),0);
    });
  }
});
/* Con datos en la nube no se permite reemplazar todo de golpe ni cambiar de rol a mano. */
['restoreBak','importData','reseed','wipe','changeClient','loginClient','toggleRole'].forEach(k=>{
  const orig=APP[k];
  APP[k]=function(){if(NUBE.on){toast('No disponible con los datos en la nube');return}return orig.apply(this,arguments)};
});
(function(){
  const orig=APP.switchRole;
  APP.switchRole=function(role){return orig.call(this,NUBE.on?(NUBE.prof.role==='cliente'?'client':'admin'):role)};
  const hash=APP.applyHashData;
  APP.applyHashData=function(){if(NUBE.on)return false;return hash.apply(this,arguments)};
})();
/* la librería y nube.js cargan diferidas: se inicia cuando ya están */
document.addEventListener('DOMContentLoaded',()=>NUBE.init());
window.addEventListener('load',()=>NUBE.init());
