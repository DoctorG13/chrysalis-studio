const DONNA_MIGRATION_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BizziBuddi · Donna data migration</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:32px 16px;background:#f3f6fb;color:#172033;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:760px;margin:30px auto}.card{background:#fff;border:1px solid #dce3ee;border-radius:16px;padding:30px;box-shadow:0 12px 35px #1c315014}h1{font-size:27px;margin:0 0 8px}.intro{color:#596579;margin:0 0 24px}.field{display:block;font-weight:650;margin:18px 0 8px}input[type=file],input[type=text]{display:block;width:100%;padding:14px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;font:inherit}button{border:0;border-radius:9px;padding:13px 18px;background:#263b64;color:#fff;font:inherit;font-weight:700;cursor:pointer;margin:16px 8px 0 0}button.secondary{background:#e8edf5;color:#263b64}button:disabled{opacity:.55;cursor:wait}.panel{margin-top:20px;padding:16px;border-radius:10px;background:#f6f8fc;border:1px solid #e1e7f0}.hidden{display:none}.status{margin-top:16px;padding:13px;border-radius:8px;white-space:pre-wrap}.error{background:#fff0f0;color:#9b1c1c}.success{background:#eaf8ef;color:#176437}.muted{font-size:14px;color:#68758a}.result{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 ui-monospace,monospace}.warning{border-left:4px solid #c47b16;padding:12px 14px;background:#fff8e9;color:#70480e;border-radius:6px}.hidden{display:none}
</style>
</head>
<body><main class="wrap"><section class="card">
<h1>Donna's Chrysalis Clothes migration</h1>
<p class="intro">Securely transfer Donna's existing account and business records into Railway without replacing the database or changing the other customers.</p>
<div class="panel"><h2>Administrator sign-in</h2><p>Sign in with the Railway platform administrator credentials. This page itself can now load without a session; the import endpoint remains protected.</p><label class="field" for="adminUsername">Administrator username</label><input id="adminUsername" type="text" autocomplete="username"><label class="field" for="adminPassword">Administrator password</label><input id="adminPassword" type="password" autocomplete="current-password"><button id="login" type="button">Sign in</button><span id="loginStatus" class="muted"></span></div>
<div class="warning"><strong>Important:</strong> Select Donna’s migration package. A verified Railway backup is created immediately before the live import. The four existing customers are retained.</div>
<label class="field" for="package">Migration package</label>
<input id="package" type="file" accept=".json,application/json">
<p class="muted">Choose the file named donna-migration-20261113.json from your computer.</p>
<button id="dryRun" type="button">Run safe dry run (optional)</button>
<div id="status" aria-live="polite"></div>
<pre id="result" class="panel result hidden"></pre>
<section id="commitPanel" class="panel hidden">
<h2>Production import</h2>
<p>Only proceed after the dry run reports success. A fresh Railway database backup will be created and verified immediately before importing.</p>
<label class="field" for="confirmation">Type the confirmation phrase exactly</label>
<input id="confirmation" type="text" autocomplete="off" placeholder="IMPORT DONNA CHRYSALIS WORKSPACE">
<button id="commit" type="button">Import Donna's account and data</button>
<p class="muted">This final action changes the production database. A verified backup is created first. Confirm only when you are ready to proceed.</p>
</section>
</section></main>
<script>
const $=id=>document.getElementById(id);
let validatedFile=null;
let dryRunPassed=false;
let adminAuthenticated=false;
function showStatus(message,kind){$('status').className='status '+kind;$('status').textContent=message;}
function showResult(data){$('result').classList.remove('hidden');$('result').textContent=JSON.stringify(data,null,2);}
$('login').addEventListener('click',async()=>{const status=$('loginStatus');status.textContent='Signing in…';try{const r=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('adminUsername').value,password:$('adminPassword').value})});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Administrator sign-in failed.');const check=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});const session=await check.json();if(!check.ok||!session.authenticated)throw Error('Sign-in did not establish an administrator session.');adminAuthenticated=true;$('adminPassword').value='';status.textContent='Signed in. You can now import.';status.style.color='#176437';}catch(e){adminAuthenticated=false;status.textContent=e.message;status.style.color='#9b1c1c';}});
async function upload(mode){
 if(!adminAuthenticated)throw new Error('Sign in as the Railway administrator first.');
 if(!validatedFile)throw new Error('Choose the migration package first.');
 const headers={'Content-Type':'application/json'};
 if(mode==='commit')headers['x-migration-confirmation']=$('confirmation').value.trim();
 const response=await fetch('/api/admin/donna-migration?mode='+mode,{method:'POST',credentials:'same-origin',headers,body:validatedFile,cache:'no-store'});
 const data=await response.json();
 showResult(data);
 if(!response.ok||!data.ok)throw new Error(data.error||'Migration request failed.');
 return data;
}
$('package').addEventListener('change',()=>{
 validatedFile=$('package').files?.[0]||null;
 dryRunPassed=false;
 $('commitPanel').classList.add('hidden');
 $('result').classList.add('hidden');
 if(!validatedFile){showStatus('No file selected.','');return;}
 if(validatedFile.name!=='donna-migration-20261113.json'){validatedFile=null;$('package').value='';showStatus('That is not the expected Donna migration package. Nothing was uploaded.','error');return;}
 showStatus('Selected '+validatedFile.name+' ('+validatedFile.size.toLocaleString()+' bytes). Ready for import. A verified backup will be made first.','success');
});
$('dryRun').addEventListener('click',async()=>{
 $('dryRun').disabled=true;$('commitPanel').classList.add('hidden');showStatus('Checking the package against Railway. No customer data will be changed…','');
 try{const data=await upload('dry-run');dryRunPassed=true;$('commitPanel').classList.remove('hidden');showStatus('Dry run passed. '+data.totalImported+' records validated; nothing was imported. Review the results below.','success');}
 catch(error){dryRunPassed=false;showStatus(error.message,'error');}
 finally{$('dryRun').disabled=false;}
});
$('commit').addEventListener('click',async()=>{
 if(!dryRunPassed)return showStatus('Run a successful dry run first.','error');
 if($('confirmation').value.trim()!=='IMPORT DONNA CHRYSALIS WORKSPACE')return showStatus('The confirmation phrase does not match. No changes made.','error');
 if(!window.confirm('This will import Donna’s account and business data into the live Railway database. A verified backup will be created first. The other four customer accounts will be retained. Proceed?'))return;
 $('commit').disabled=true;showStatus('Creating and verifying the Railway backup, then importing Donna’s records…','');
 try{const data=await upload('commit');dryRunPassed=false;showStatus('Import completed. Backup verified: '+Boolean(data.backup?.verified)+'. Donna’s records imported: '+data.totalImported+'. Please review the results below.','success');}
 catch(error){showStatus(error.message,'error');}
 finally{$('commit').disabled=false;}
});
</script></body></html>`;

export function serveDonnaMigrationPage(response) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  });
  response.end(DONNA_MIGRATION_PAGE);
}
