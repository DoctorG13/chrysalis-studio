const DONNA_MIGRATION_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BizziBuddi - Donna data migration</title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:32px 16px;background:#f3f6fb;color:#172033;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
.wrap{max-width:760px;margin:30px auto}
.card{background:#fff;border:1px solid #dce3ee;border-radius:16px;padding:30px;box-shadow:0 12px 35px #1c315014}
h1{font-size:27px;margin:0 0 8px}
h2{font-size:20px;margin:0 0 10px}
.intro{color:#596579;margin:0 0 24px}
.field{display:block;font-weight:650;margin:18px 0 8px}
input[type=file],input[type=text],input[type=password]{display:block;width:100%;padding:14px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;font:inherit}
button{border:0;border-radius:9px;padding:13px 18px;background:#263b64;color:#fff;font:inherit;font-weight:700;cursor:pointer;margin:16px 8px 0 0}
button.secondary{background:#e8edf5;color:#263b64}
button:disabled{opacity:.55;cursor:wait}
.panel{margin-top:20px;padding:16px;border-radius:10px;background:#f6f8fc;border:1px solid #e1e7f0}
.hidden{display:none!important}
.status{margin-top:16px;padding:13px;border-radius:8px;white-space:pre-wrap}
.error{background:#fff0f0;color:#9b1c1c}
.success{background:#eaf8ef;color:#176437}
.muted{font-size:14px;color:#68758a}
.result{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 ui-monospace,monospace}
.warning{border-left:4px solid #c47b16;padding:12px 14px;background:#fff8e9;color:#70480e;border-radius:6px}
</style>
</head>
<body>
<main class="wrap">
<section class="card">
<h1>Donna's Chrysalis Clothes migration</h1>
<p class="intro">Securely transfer Donna's existing account and business records into Railway without replacing the database or changing other customers.</p>

<div class="panel">
<h2>Administrator sign-in</h2>
<p>Sign in with the Railway platform administrator credentials. The migration endpoint remains protected by server-side authentication.</p>
<label class="field" for="adminUsername">Administrator username</label>
<input id="adminUsername" type="text" autocomplete="username">
<label class="field" for="adminPassword">Administrator password</label>
<input id="adminPassword" type="password" autocomplete="current-password">
<button id="login" type="button">Sign in</button>
<span id="loginStatus" class="muted"></span>
</div>

<div class="warning">
<strong>Important:</strong> The dry-run checks the migration package against the live Railway database without committing changes. A separate verified database backup is created only when you explicitly start the production import.
</div>

<label class="field" for="package">Migration package</label>
<input id="package" type="file" accept=".json,application/json">
<p class="muted">Choose donna-migration-20261113.json from your computer.</p>
<p class="muted">The expected package is checked by the server, including its checksum, account identity, records and database compatibility.</p>

<div id="status" aria-live="polite"></div>
<pre id="result" class="panel result hidden"></pre>

<section id="dryRunPanel" class="panel hidden">
<h2>Step 1 - Validate against Railway</h2>
<p>Run a dry-run against the current Railway database. This validates the import inside a transaction that is rolled back. No records are committed and no pre-import backup is created.</p>
<button id="dryRun" type="button">Run production dry-run</button>
</section>

<section id="commitPanel" class="panel hidden">
<h2>Step 2 - Production import</h2>
<p>The dry-run passed. Before importing, the server will create a separate backup on the Railway persistent volume, verify SQLite integrity and foreign keys, and calculate a SHA-256 checksum.</p>
<label class="field" for="confirmation">Type the confirmation phrase exactly</label>
<input id="confirmation" type="text" autocomplete="off" placeholder="IMPORT DONNA CHRYSALIS WORKSPACE">
<button id="commit" type="button">Import Donna's account and data</button>
<p class="muted">This final action changes the production database. Do not proceed until you have reviewed the dry-run results and are satisfied that the target database is correct.</p>
</section>
</section>
</main>

<script>
const $=id=>document.getElementById(id);
const CONFIRMATION='IMPORT DONNA CHRYSALIS WORKSPACE';
const EXPECTED_FILE='donna-migration-20261113.json';

let validatedFile=null;
let adminAuthenticated=false;
let dryRunValidated=false;
let requestInProgress=false;

function showStatus(message,kind){
  $('status').className='status '+(kind||'');
  $('status').textContent=message;
}

function showResult(data){
  $('result').classList.remove('hidden');
  $('result').textContent=JSON.stringify(data,null,2);
}

function invalidateDryRun(){
  dryRunValidated=false;
  $('commitPanel').classList.add('hidden');
  $('confirmation').value='';
}

async function upload(mode){
  if(!adminAuthenticated){
    throw new Error('Sign in as the Railway administrator first.');
  }

  if(!validatedFile){
    throw new Error('Choose the migration package first.');
  }

  const headers={'Content-Type':'application/json'};

  if(mode==='commit'){
    headers['x-migration-confirmation']=$('confirmation').value.trim();
  }

  const response=await fetch('/api/admin/donna-migration?mode='+mode,{
    method:'POST',
    credentials:'same-origin',
    headers,
    body:validatedFile,
    cache:'no-store'
  });

  const data=await response.json();
  showResult(data);

  if(!response.ok||!data.ok){
    throw new Error(data.error||'Migration request failed.');
  }

  return data;
}

$('login').addEventListener('click',async()=>{
  if(requestInProgress)return;

  const status=$('loginStatus');
  $('login').disabled=true;
  status.textContent='Signing in...';

  try{
    const response=await fetch('/api/auth/login',{
      method:'POST',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        username:$('adminUsername').value,
        password:$('adminPassword').value
      })
    });

    const data=await response.json();

    if(!response.ok||!data.ok){
      throw new Error(data.error||'Administrator sign-in failed.');
    }

    const check=await fetch('/api/auth/me',{
      credentials:'same-origin',
      cache:'no-store'
    });

    const session=await check.json();

    if(!check.ok||!session.authenticated){
      throw new Error('Sign-in did not establish an administrator session.');
    }

    adminAuthenticated=true;
    $('adminPassword').value='';
    status.textContent='Signed in successfully.';
    status.style.color='#176437';

    if(validatedFile){
      $('dryRunPanel').classList.remove('hidden');
      showStatus('Administrator authenticated. Run the dry-run to validate the selected package.','success');
    }
  }catch(error){
    adminAuthenticated=false;
    status.textContent=error.message;
    status.style.color='#9b1c1c';
  }finally{
    $('login').disabled=false;
  }
});

$('package').addEventListener('change',()=>{
  invalidateDryRun();
  validatedFile=$('package').files?.[0]||null;
  $('dryRunPanel').classList.add('hidden');
  $('result').classList.add('hidden');

  if(!validatedFile){
    showStatus('No migration package selected.','');
    return;
  }

  if(validatedFile.name!==EXPECTED_FILE){
    validatedFile=null;
    $('package').value='';
    showStatus('That is not the expected Donna migration package. Nothing was uploaded.','error');
    return;
  }

  if(validatedFile.size===0){
    validatedFile=null;
    $('package').value='';
    showStatus('The selected migration package is empty.','error');
    return;
  }

  if(!adminAuthenticated){
    showStatus('Package selected. Sign in as the Railway administrator before running the dry-run.','');
    return;
  }

  $('dryRunPanel').classList.remove('hidden');
  showStatus(
    'Selected '+validatedFile.name+' ('+validatedFile.size.toLocaleString()+' bytes). No production changes have been made.',
    'success'
  );
});

$('dryRun').addEventListener('click',async()=>{
  if(requestInProgress)return;

  requestInProgress=true;
  $('dryRun').disabled=true;
  $('commit').disabled=true;
  invalidateDryRun();
  showStatus('Running production dry-run. The database transaction will be rolled back...','');

  try{
    const data=await upload('dry-run');

    if(data.ok!==true||data.mode!=='dry-run'||data.committed!==false||data.totalImported!==96){
      throw new Error('The server did not confirm a non-committing dry-run. Production import remains disabled.');
    }

    dryRunValidated=true;
    $('commitPanel').classList.remove('hidden');

    showStatus(
      'Dry-run passed. '+data.totalImported+' records were validated. No changes were committed and no backup was created. Review the results before deciding whether to proceed.',
      'success'
    );
  }catch(error){
    invalidateDryRun();
    showStatus('Dry-run failed: '+error.message+' Production import remains disabled.','error');
  }finally{
    requestInProgress=false;
    $('dryRun').disabled=false;
    $('commit').disabled=false;
  }
});

$('commit').addEventListener('click',async()=>{
  if(requestInProgress)return;

  if(!dryRunValidated){
    showStatus('A successful dry-run is required before production import.','error');
    invalidateDryRun();
    return;
  }

  if($('confirmation').value.trim()!==CONFIRMATION){
    showStatus('The confirmation phrase does not match. No changes made.','error');
    return;
  }

  const accepted=window.confirm(
    "This will import Donna's account and business data into the live Railway database. A verified pre-import backup will be created first. The production database will be changed. Have you reviewed the successful dry-run results?"
  );

  if(!accepted)return;

  requestInProgress=true;
  $('commit').disabled=true;
  $('dryRun').disabled=true;
  showStatus("Creating and verifying the Railway backup, then importing Donna's records...",'');

  try{
    const data=await upload('commit');

    if(data.ok !== true || data.mode !== 'commit' || data.committed !== true || data.totalImported !== 96){
      throw new Error('The server did not return the expected successful 96-record commit result. Do not retry automatically. Review the returned result and production database state.');
    }

    const backup=data.backup;
    const backupIsVerified =
      backup &&
      backup.verified === true &&
      backup.integrity === 'ok' &&
      backup.foreignKeyViolations === 0 &&
      Number.isSafeInteger(backup.sizeBytes) &&
      backup.sizeBytes > 0 &&
      typeof backup.sha256 === 'string' &&
      /^[a-f0-9]{64}$/.test(backup.sha256);

    if(!backupIsVerified){
      throw new Error('The server reported that the import was committed, but the pre-import backup details could not be fully verified. Do not retry. Review the returned result and Railway database state.');
    }

    const backupMessage=
      'Backup: '+backup.name+
      '\\nVerified: yes'+
      '\\nIntegrity: '+backup.integrity+
      '\\nForeign-key violations: '+backup.foreignKeyViolations+
      '\\nSize: '+backup.sizeBytes.toLocaleString()+' bytes'+
      '\\nSHA-256: '+backup.sha256;

    showStatus(
      'Import completed. Records imported: '+data.totalImported+
      '\\n'+backupMessage+
      '\\nPlease retain the backup details and review the full results below.',
      'success'
    );

    dryRunValidated=false;
    $('commitPanel').classList.add('hidden');
  }catch(error){
    showStatus(
      'Production import request returned an error: '+error.message+
      '\\nDo not retry automatically. Review the server result and database state first.',
      'error'
    );
  }finally{
    requestInProgress=false;
    $('commit').disabled=false;
    $('dryRun').disabled=false;
  }
});
</script>
</body>
</html>`;

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
