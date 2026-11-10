/* ================= WIRING ================= */
document.querySelectorAll('.nav button[data-page]').forEach(btn=>btn.addEventListener('click',()=>gotoPage(btn.dataset.page)));
document.querySelectorAll('.role-switch button').forEach(btn=>btn.addEventListener('click',()=>APP.switchRole(btn.dataset.role)));
document.getElementById('btnSwitchClient').addEventListener('click',()=>APP.changeClient());
document.getElementById('loginBtn').addEventListener('click',()=>APP.loginClient());
document.getElementById('welcomeBtn').addEventListener('click',()=>{db.meta.seenWelcome=true;saveDb();$('#welcomeOverlay').classList.add('off')});
document.getElementById('btnBell').addEventListener('click',e=>{
  e.stopPropagation();
  const pop=$('#notifPop');pop.classList.toggle('show');
  if(pop.classList.contains('show')){
    myNotifs().forEach(n=>n.read=true);saveDb();renderBell();
  }
});
document.addEventListener('click',e=>{
  const pop=$('#notifPop');
  if(pop.classList.contains('show')&&!pop.contains(e.target)&&e.target.id!=='btnBell')pop.classList.remove('show');
});
document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')}));
document.getElementById('maFotoFile').addEventListener('change',e=>{if(e.target.files[0])APP.setMachinePhoto(e.target.files[0]);e.target.value=''});
document.getElementById('impFile').addEventListener('change',e=>{if(e.target.files[0])APP.importData(e.target.files[0]);e.target.value=''});
document.getElementById('impCSV').addEventListener('change',e=>{
  const f=e.target.files[0];e.target.value='';
  if(!f)return;
  const r=new FileReader();
  r.onload=()=>APP.importCSVText(String(r.result||''));
  r.readAsText(f,'utf-8');
});

/* ================= INICIO ================= */
loadDb();
db.meta.biz=db.meta.biz||{name:'Mi Empresa',cif:'',phone:'',city:''};
db.meta.invSeq=db.meta.invSeq||0;
recomputeStages(true);
updateTrialUI();
renderBell();
if(!db.meta.seenWelcome)$('#welcomeOverlay').classList.remove('off');
APP.applyHashData();
gotoPage('dashboard');
