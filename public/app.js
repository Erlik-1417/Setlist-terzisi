import {t, getLanguage, setLanguage, captureStaticText} from './i18n.js';
import {englishSongs} from './english-songs.js';
import {validateSettings, ruleOrder, makePlan, totalSeconds, clockTime, trackTime} from './planner.js';
const $ = id => document.getElementById(id);
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const translateStatic = captureStaticText(document.body);
const demo = [
 ['Beni Sen İnandır','Pinhani',228,'Em',2,1],['Senden Daha Güzel','Duman',240,'Am',4,2],['Gülpembe','Barış Manço',285,'Em',2,2],['Bir Derdim Var','mor ve ötesi',205,'F#m',5,3],['Renkli Rüyalar Oteli','Teoman',250,'Am',3,2],['Sarı Laleler','MFÖ',235,'Em',2,1],['Dünyadan Uzak','Pinhani',255,'Bm',3,2],['Ele Güne Karşı','MFÖ',195,'Am',4,2],['Bu Akşam','Duman',190,'Em',5,3],['Sil Baştan','Şebnem Ferah',280,'Am',3,3],['Her Şeyi Yak','Duman',255,'Em',4,3],['Güzel Bir Gün','Teoman',220,'G',3,1],['Yıldızların Altında','Kargo',245,'Am',4,2],['Paramparça','Teoman',230,'Em',3,2],['Aşkın Olayım','Simge',210,'Am',5,3],['İki Yabancı','Teoman',265,'Em',2,1],
].map((s,i)=>({id:`demo-${i}`,title:s[0],artist:s[1],seconds:s[2],key:s[3],energy:s[4],vocal:s[5],selected:true}));
let songs = structuredClone(demo), plan = null, editing = null, busy = false;
const settingIds=['eventName','eventType','start','duration','setCount','breakMin','flow','protect'];
function eventData(){return {name:$('eventName').value.trim()||t('İsimsiz program'),type:$('eventType').value,start:$('start').value,duration:Number($('duration').value),setCount:Number($('setCount').value),breakMin:Number($('breakMin').value),flow:$('flow').value,protect:$('protect').checked,language:getLanguage()};}
try {
  const saved = JSON.parse(localStorage.getItem('setlist-terzisi-v1'));
  if (saved && Array.isArray(saved.songs) && saved.songs.length <= 100 && saved.songs.every(s => s && typeof s.id==='string' && typeof s.title==='string' && typeof s.artist==='string' && Number.isInteger(s.seconds) && s.seconds>0 && s.seconds<3600 && [1,2,3,4,5].includes(s.energy) && [1,2,3].includes(s.vocal)) && new Set(saved.songs.map(s=>s.id)).size===saved.songs.length) {
    songs=saved.songs;
    for(const id of settingIds) if(saved.settings && id in saved.settings) id==='protect'?$(id).checked=Boolean(saved.settings[id]):$(id).value=saved.settings[id];
  }
} catch {}
function persist(){try{const settings=Object.fromEntries(settingIds.map(id=>[id,id==='protect'?$(id).checked:$(id).value]));localStorage.setItem('setlist-terzisi-v1',JSON.stringify({songs,settings}));$('saved').textContent=t('● Bu tarayıcıya kaydedildi');}catch{$('saved').textContent=t('Tarayıcı kaydı kullanılamıyor');}}
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',5000);}
function renderLibrary(){
 const query=$('search').value.toLocaleLowerCase(getLanguage());
 $('songCount').textContent=`${songs.filter(s=>s.selected).length}/${songs.length} ${t('seçili')}`;
 $('selectionSummary').textContent=`${songs.filter(s=>s.selected).length} ${t('şarkı')} · ${Math.round(totalSeconds(songs.filter(s=>s.selected))/60)} ${t('dk')} ${t('repertuvar')}`;
 const filtered=songs.filter(s=>`${s.title} ${s.artist}`.toLocaleLowerCase(getLanguage()).includes(query));
 $('library').innerHTML=filtered.map(s=>`<div class="song"><input type="checkbox" data-select="${escape(s.id)}" ${s.selected?'checked':''} aria-label="${escape(s.title)} ${t('seç')}"><div><div class="song-name">${escape(s.title)}</div><div class="song-artist">${escape(s.artist)} · ${escape(s.key||t('Ton yok'))}${s.vocal===3?' · '+t('Zor vokal'):''}</div></div><div class="song-side"><div><div class="song-duration">${trackTime(s.seconds)}</div><div class="energy-dots" aria-label="${t('Enerji')} ${s.energy}/5">${[1,2,3,4,5].map(i=>`<i class="${i<=s.energy?'on':''}"></i>`).join('')}</div></div><button class="edit-song" data-edit="${escape(s.id)}" aria-label="${escape(s.title)} ${t('düzenle')}">✎</button><button class="delete-song" data-delete="${escape(s.id)}" aria-label="${escape(s.title)} ${t('sil')}">×</button></div></div>`).join('') || `<p class="empty">${t('Şarkı bulunamadı. Repertuvarına bir şarkı ekle.')}</p>`;
}
function preview(reason='Enerji akışı, girdiğin değerlere göre düzenlendi. Süreler kendi yorumuna göre değişebilir; örnek repertuvar verilerini sahne öncesi kontrol et.'){
 try{const event=eventData();const selected=songs.filter(s=>s.selected);plan={...makePlan(selected,event,ruleOrder(selected,event)),event,mode:'rules',reason};renderPlan();}catch(e){plan=null;$('plan').innerHTML=`<p class="empty">${t('Program ayarlarını kontrol et.')}</p>`;$('warnings').textContent=t(e.message);$('stats').innerHTML='';$('energyChart').innerHTML='';$('planTitle').textContent=eventData().name;$('planSubtitle').textContent=t('Geçerli ayarları girdikten sonra oluştur.');}
 $('modeBadge').textContent=t('Yerleşik planlayıcı');
}
function renderPlan(){
 const {sets,event}=plan; const flat=sets.flat();const music=totalSeconds(flat), breaks=(sets.length-1)*event.breakMin*60; const slack=event.duration*60-music-breaks;
 $('planTitle').textContent=event.name;$('planSubtitle').textContent=`${t(event.type)} · ${event.start} ${t('başlangıç')} · ${event.setCount} ${t('set')}`;
 $('stats').innerHTML=`<div class="stat"><strong>${flat.length}<small> ${t('şarkı')}</small></strong><span>${t('SAHNE REPERTUVARI')}</span></div><div class="stat"><strong>${Math.floor(music/60)}<small> ${t('dk')} ${music%60?music%60+' '+t('sn'):''}</small></strong><span>${t('NET MÜZİK')}</span></div><div class="stat"><strong>${t(clockTime(event.start,music+breaks)).replace(' (+1 gün)', t(' (+1 gün)'))}</strong><span>${t('PLANLANAN BİTİŞ')}</span></div>`;
 $('energyChart').innerHTML=flat.map(s=>`<div class="energy-bar" style="height:${s.energy*18}%" title="${escape(s.title)} · ${t('Enerji')} ${s.energy}/5"></div>`).join('');
 let elapsed=0;
 $('plan').innerHTML=sets.map((tracks,k)=>{
 const begin=clockTime(event.start,elapsed).replace(' (+1 gün)', t(' (+1 gün)'));const seconds=totalSeconds(tracks);elapsed+=seconds;const end=clockTime(event.start,elapsed).replace(' (+1 gün)', t(' (+1 gün)'));
 let html=`<div class="set-header"><h3>Set ${String(k+1).padStart(2,'0')}</h3><span>${begin} — ${end} · ${trackTime(seconds)}</span></div>`;
 html+=tracks.map((s,i)=>`<div class="track"><span class="track-number">${String(i+1).padStart(2,'0')}</span><div><div class="track-name">${escape(s.title)}${s.vocal===3?`<span class="vocal-badge">${t('ZOR VOKAL')}</span>`:''}</div><div class="track-artist">${escape(s.artist)}</div></div><span class="track-key">${escape(s.key||'—')}</span><span class="track-time">${trackTime(s.seconds)}</span><div class="track-controls"><button data-move="${k},${i},-1" ${i===0?'disabled':''} aria-label="${escape(s.title)} ${t('yukarı')}">↑</button><button data-move="${k},${i},1" ${i===tracks.length-1?'disabled':''} aria-label="${escape(s.title)} ${t('aşağı')}">↓</button></div></div>`).join('')||`<p class="empty">${t('Bu sete sığan seçili şarkı yok.')}</p>`;
 if(k<sets.length-1){html+=`<div class="break-row"><span>Ⅱ ${t('SET ARASI')} · ${event.breakMin} ${t('DK')}</span><span>${end} → ${clockTime(event.start,elapsed+event.breakMin*60).replace(' (+1 gün)', t(' (+1 gün)'))}</span></div>`;elapsed+=event.breakMin*60;}
 return html;}).join('');
 const warnings=[];
 if(!flat.length)warnings.push(t('Henüz çalınacak şarkı yok. Şarkı seç veya program süresini artır.'));
 if(slack>0)warnings.push(t('{time} süre boşta: konuşmalar, geçişler veya ek şarkılar için kullanılabilir. Boş süre bitiş saatine eklenmedi.',{time:trackTime(slack)}));
 if(plan.unused.length)warnings.push(t('Süreye sığmayan {count} şarkı: {songs}.',{count:plan.unused.length,songs:plan.unused.map(s=>s.title).join(', ')}));
 if(sets.some(set=>set.some((s,i)=>i>0&&s.vocal===3&&set[i-1].vocal===3)))warnings.push(t('Peş peşe zor vokal var; repertuvarı veya sıralamayı gözden geçir.'));
 $('warnings').textContent=warnings.join(' ');$('reasonTitle').textContent=plan.mode==='ai'?t('Modelin sahne notu.'):t('Biraz nefes, biraz yükseliş.');$('reason').textContent=t(plan.reason);
 $('modeBadge').textContent=plan.mode==='ai'?`${plan.model} · AI`:t('Yerleşik planlayıcı');
}
for(const id of settingIds)$(id).addEventListener('change',()=>{persist();preview();});
$('search').addEventListener('input',renderLibrary);
$('library').addEventListener('change',e=>{if(e.target.dataset.select){songs.find(s=>s.id===e.target.dataset.select).selected=e.target.checked;persist();renderLibrary();preview();}});
$('library').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit)openSong(edit.dataset.edit);if(del){songs=songs.filter(s=>s.id!==del.dataset.delete);persist();renderLibrary();preview();toast(t('Şarkı repertuvardan kaldırıldı.'));}});
function openSong(id=null){editing=id;const form=$('songForm');form.reset();$('dialogTitle').textContent=id?t('Şarkıyı düzenle.'):t('Repertuvara ekle.');if(id){const s=songs.find(s=>s.id===id);for(const key of ['title','artist','energy','vocal','key'])form.elements[key].value=s[key]||'';form.elements.time.value=trackTime(s.seconds);}$('songDialog').showModal();}
$('addSong').onclick=()=>{if(songs.length>=100)return toast(t('En fazla 100 şarkı ekleyebilirsin.'));openSong();};$('closeDialog').onclick=()=>$('songDialog').close();
$('songForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const [m,s]=f.get('time').split(':').map(Number);const seconds=m*60+s;if(!seconds||seconds>3599)return toast(t('Süre 0:01–59:59 arasında olmalı.'));if(!f.get('title').trim()||!f.get('artist').trim())return toast(t('Şarkı ve sanatçı adını gir.'));const song={id:editing||crypto.randomUUID(),title:f.get('title').trim(),artist:f.get('artist').trim(),seconds,key:f.get('key').trim(),energy:Number(f.get('energy')),vocal:Number(f.get('vocal')),selected:editing?songs.find(s=>s.id===editing).selected:true};if(editing)songs=songs.map(s=>s.id===editing?song:s);else songs.push(song);persist();renderLibrary();preview();$('songDialog').close();};
$('loadDemo').onclick=()=>{if(!confirm(t('Mevcut repertuvar örnek şarkılarla değiştirilsin mi?')))return;songs=structuredClone(demo);persist();renderLibrary();preview();};
$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
$('plan').addEventListener('click',e=>{const button=e.target.closest('[data-move]');if(!button||!plan)return;const [k,i,d]=button.dataset.move.split(',').map(Number);const list=plan.sets[k];if(!list[i+d])return;[list[i],list[i+d]]=[list[i+d],list[i]];plan.reason='Sıralama elle düzenlendi. Süreler ve vokal uyarıları yeniden hesaplandı.';renderPlan();});
let availableModels=[];
function renderModelStatus(){ $('modelStatus').textContent=availableModels.length?t('{count} yerel model hazır. AI modunda repertuvar Ollama’ya gönderilir; bu bilgisayarda işlenir.',{count:availableModels.length}):t('Ollama bulunamadı veya model yok. Yerleşik planlayıcı hazır. AI için README’deki yerel model kurulumunu tamamla.'); }
async function models(){try{const res=await fetch('/api/models');const data=await res.json();$('model').replaceChildren(...data.models.map(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;return o;}));availableModels=data.models;renderModelStatus();}catch{$('modelStatus').textContent=t('Model bağlantısı kontrol edilemedi. Uygulamayı Python sunucusuyla aç.');}}
$('engine').onchange=()=>{$('modelLabel').hidden=$('engine').value!=='ai';};$('refreshModels').onclick=models;
$('generate').onclick=async()=>{
 if(busy)return;const selected=structuredClone(songs.filter(s=>s.selected));const event=eventData();try{validateSettings(event);if(!selected.length)throw Error(t('Önce en az bir şarkı seç.'));}catch(e){return toast(t(e.message));}
 if($('engine').value==='rules'){preview('Şarkılar, seçtiğin enerji akışına göre sıralandı; setler süre sınırına göre dolduruldu. Bu programda AI kullanılmadı.');toast(t('Setin hazır. Son bir göz at, sahne senin.'));return;}
 if(!$('model').value)return toast(t('Yerel model bulunamadı. Ollama’yı başlatıp bir model indir; ardından Yenile’ye bas.'));
 busy=true;const button=$('generate');button.disabled=true;button.textContent=t('Model düşünüyor…');const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),190000);
 const snapshot=JSON.stringify({songs:selected,event});
 try{const res=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({songs:selected,event,model:$('model').value}),signal:controller.signal});const data=await res.json();if(!res.ok)throw Error(data.error||t('Plan oluşturulamadı.'));if(snapshot!==JSON.stringify({songs:songs.filter(s=>s.selected),event:eventData()}))throw Error(t('Planlama sırasında ayarlar değişti. Güncel bilgilerle yeniden oluştur.'));plan={...makePlan(selected,event,data.order),event,mode:'ai',model:data.model,reason:data.reason};renderPlan();toast(t('Açık modelle programın oluşturuldu.'));}catch(e){toast(e.name==='AbortError'?t('Model zaman aşımına uğradı. Daha küçük bir modelle tekrar dene.'):t(e.message));}finally{clearTimeout(timeout);busy=false;button.disabled=false;button.innerHTML=t('Setimi oluştur')+' <span>↗</span>';}
};
function planText(){return `${plan.event.name}\n${t(plan.event.type)} · ${plan.event.start}\n${plan.mode==='ai'?'AI: '+plan.model:t('Yerleşik planlayıcı — AI kullanılmadı')}\n\n`+plan.sets.map((set,k)=>`SET ${k+1}\n`+set.map((s,i)=>`${i+1}. ${s.title} — ${s.artist} | ${s.key||'—'} | ${trackTime(s.seconds)}`).join('\n')+(k<plan.sets.length-1?`\n\n${t('MOLA')}: ${plan.event.breakMin} ${t('dk')}`:'' )).join('\n\n')+`\n\n${t('NOTLAR')}\n${$('warnings').textContent}\n\n${t(plan.reason)}\n\nSetlist Terzisi` ;}
$('export').onclick=()=>{if(!plan||!plan.sets.flat().length)return toast(t('Önce bir program oluştur.'));const url=URL.createObjectURL(new Blob([planText()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='setlist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('print').onclick=()=>{if(!plan||!plan.sets.flat().length)return toast(t('Önce bir program oluştur.'));window.print();};
$('addEnglish').onclick=()=>{
 const existing=new Set(songs.map(s=>`${s.title.toLowerCase()}|${s.artist.toLowerCase()}`));
 const additions=englishSongs.filter(s=>!existing.has(`${s.title.toLowerCase()}|${s.artist.toLowerCase()}`));
 if(!additions.length)return toast(t('İngilizce örnek parçalar zaten repertuvarında.'));
 if(songs.length+additions.length>100)return toast(t('En fazla 100 şarkı ekleyebilirsin.'));
 songs.push(...structuredClone(additions).map(s=>({...s,id:crypto.randomUUID()})));
 persist();renderLibrary();preview();toast(t('{count} İngilizce parça eklendi. Mevcut şarkıların korundu.',{count:additions.length}));
};
$('language').value=getLanguage();
$('language').onchange=()=>{
 setLanguage($('language').value);translateStatic();renderLibrary();renderModelStatus();
 if(plan){if(plan.mode==='ai'&&plan.event.language!==getLanguage())toast(t('Model notu önceki dilde; seçili dilde yeni not için yeniden oluştur.'));renderPlan();}else preview();
 $('generate').innerHTML=busy?t('Model düşünüyor…'):t('Setimi oluştur')+' <span>↗</span>';
 $('saved').textContent=t('● Bu tarayıcıda saklanır');
};
try {
 if(!localStorage.getItem('setlist-english-pack-v1')){
  const existing=new Set(songs.map(s=>`${s.title.toLowerCase()}|${s.artist.toLowerCase()}`));
  const additions=englishSongs.filter(s=>!existing.has(`${s.title.toLowerCase()}|${s.artist.toLowerCase()}`));
  if(songs.length+additions.length<=100){songs.push(...structuredClone(additions).map(s=>({...s,id:crypto.randomUUID()})));persist();localStorage.setItem('setlist-english-pack-v1','1');}
 }
} catch {}
translateStatic();renderLibrary();preview();models();
