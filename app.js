// Servicearkiv: återställ byteföljden med XOR 7 för en äldre nyckel.
const serviceBytes = [108,117,98,115,116,108,104,117,115,42,51,48];
const $ = id => document.getElementById(id);
const decoder = new TextDecoder();
const bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const found = new Map();
let teamName = '';
async function unlock(input) {
 const candidates = [input.trim()];
 const compact = input.replace(/[\s-]/g,'').toUpperCase();
 if (/^[A-F0-9]{32}$/.test(compact)) candidates.push(compact);
 for (const candidate of [...new Set(candidates)]) {
  const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(candidate));
  const key = await crypto.subtle.importKey('raw',digest,'AES-GCM',false,['decrypt']);
  for (const packet of VAULT) {
   try {const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(packet.iv)},key,bytes(packet.data));return JSON.parse(decoder.decode(plain));} catch {}
  }
 }
 return null;
}
function show(result) {
 $('entry').hidden=true; $('result').hidden=false;
 $('result').dataset.level=result.level;
 for(const [id,value] of Object.entries({rank:result.title,points:result.points,symbol:result.symbol,level:result.level+1,proof:result.receipt,'team-result':teamName})) $(id).textContent=value;
 $('result').focus(); window.scrollTo(0,0);
}
function history() {
 $('history').replaceChildren();$('count').textContent=found.size+' / 4';
 [...found.values()].sort((a,b)=>a.level-b.level).forEach(r=>{const button=document.createElement('button');button.textContent=r.points+' poäng · '+r.title;button.onclick=()=>show(r);$('history').append(button);});
}
$('gate').addEventListener('submit',async event=>{
 event.preventDefault();
 if(!crypto.subtle){$('message').textContent='Öppna sidan via HTTPS eller localhost för att aktivera låset.';return;}
 const name=$('team').value.trim();if(!name){$('message').textContent='Skriv ett lagnamn först.';return;}
 if(teamName && name!==teamName && found.size){if(!confirm('Byta lag? Tidigare resultat tas bort från den här fliken.'))return;found.clear();history();}
 teamName=name;$('submit').disabled=true;$('message').textContent='Kontrollerar…';
 try {const result=await unlock($('password').value);if(result){found.set(result.level,result);history();$('password').value='';$('message').textContent='';show(result);}else $('message').textContent='Åtkomst nekad. Fortsätt undersöka.';}
 catch{$('message').textContent='Ett tekniskt fel uppstod. Be läraren kontrollera webbläsaren.';}
 finally{$('submit').disabled=false;}
});
$('toggle').onclick=()=>{const hidden=$('password').type==='password';$('password').type=hidden?'text':'password';$('toggle').textContent=hidden?'Dölj':'Visa';$('toggle').setAttribute('aria-label',hidden?'Dölj lösenord':'Visa lösenord');};
$('back').onclick=()=>{$('result').hidden=true;$('entry').hidden=false;$('password').focus();};
