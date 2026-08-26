# Chrysalis Studio - install Settings database support
# Generated from the verified working server/index.js at commit 31c4d75.
$ErrorActionPreference = "Stop"

$repoRoot = git rev-parse --show-toplevel
if (-not $repoRoot) { throw "Not inside a Git repository." }
Set-Location $repoRoot

$status = git status --short -- server/index.js
if ($status) {
    throw "server/index.js has local changes. Nothing was changed."
}

$current = (git rev-parse HEAD:server/index.js).Trim()
$expected = (git rev-parse 31c4d75:server/index.js).Trim()
if ($current -ne $expected) {
    throw "server/index.js is not the expected clean 31c4d75 version. Nothing was changed."
}

$backup = "server/index.js.before-settings"
Copy-Item "server/index.js" $backup -Force

$patch = @'
--- server/index.js
+++ server/index.js
@@ -182,6 +182,17 @@
 
       INSERT OR REPLACE INTO app_metadata (key, value)
         VALUES ('schema_name', 'chrysalis-business-data');
+    `,
+  },
+  {
+    version: 2,
+    name: "application-settings",
+    sql: `
+      CREATE TABLE IF NOT EXISTS settings (
+        key TEXT PRIMARY KEY,
+        value TEXT NOT NULL,
+        updated_at TEXT NOT NULL
+      );
     `,
   },
 ];
@@ -532,6 +543,130 @@
   return row ? clientFromRow(row) : null;
 }
 
+const DEFAULT_SETTINGS = {
+  business: {
+    businessName: "",
+    ownerName: "",
+    address: "",
+    phone: "",
+    email: "",
+    website: "",
+    abn: "",
+  },
+  financial: {
+    gstRate: 10,
+    depositPercent: 25,
+    paymentTerms: 14,
+    currency: "AUD",
+  },
+  quotesInvoices: {
+    quoteValidityDays: 30,
+    invoicePrefix: "INV",
+    quotePrefix: "QUO",
+    paymentInstructions: "",
+    terms: "",
+  },
+  jobs: {
+    referencePrefix: "CHR",
+    defaultStatus: "Quote",
+    defaultPriority: "Normal",
+    workflowStages:
+      "Quote, Cutting, Sewing, Fitting, Finishing, Completed, Collected",
+  },
+  calendar: {
+    workingDays:
+      "Monday, Tuesday, Wednesday, Thursday, Friday",
+    openingTime: "09:00",
+    closingTime: "17:00",
+    defaultAppointmentDuration: 60,
+  },
+  production: {
+    garmentCategories:
+      "Wedding Dress, Formal Dress, Alteration, Other",
+    productionStages:
+      "Quote, Cutting, Sewing, Fitting, Finishing, Completed",
+    measurementUnit: "cm",
+  },
+};
+
+function cloneDefaultSettings() {
+  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
+}
+
+function getSettings(database) {
+  const rows = database
+    .prepare("SELECT key, value FROM settings ORDER BY key")
+    .all();
+
+  const settings = cloneDefaultSettings();
+
+  for (const row of rows) {
+    try {
+      const stored = JSON.parse(row.value);
+      if (
+        stored &&
+        typeof stored === "object" &&
+        !Array.isArray(stored) &&
+        settings[row.key] &&
+        typeof settings[row.key] === "object"
+      ) {
+        settings[row.key] = {
+          ...settings[row.key],
+          ...stored,
+        };
+      }
+    } catch {
+      // Ignore malformed stored values and retain defaults.
+    }
+  }
+
+  return settings;
+}
+
+function saveSettings(database, input) {
+  const defaults = cloneDefaultSettings();
+  const settings = {
+    ...defaults,
+    ...(input || {}),
+  };
+  const now = new Date().toISOString();
+
+  database.exec("BEGIN IMMEDIATE");
+
+  try {
+    const statement = database.prepare(
+      `INSERT INTO settings (key, value, updated_at)
+       VALUES (?, ?, ?)
+       ON CONFLICT(key) DO UPDATE SET
+         value = excluded.value,
+         updated_at = excluded.updated_at`
+    );
+
+    for (const key of Object.keys(defaults)) {
+      statement.run(
+        key,
+        JSON.stringify(settings[key]),
+        now
+      );
+    }
+
+    database.exec("COMMIT");
+  } catch (error) {
+    database.exec("ROLLBACK");
+    throw error;
+  }
+
+  return getSettings(database);
+}
+
+function resetSettings(database) {
+  database.exec("BEGIN IMMEDIATE");
+
+  try {
+    database.exec("DELETE FROM settings");
+    database.exec("COMMIT");
+  } catch (error) {
+    database.exec("ROLLBACK");
+    throw error;
+  }
+
+  return getSettings(database);
+}
+
 function createApiServer(database) {
@@ -572,6 +707,35 @@
         return;
       }
 
+      if (request.method === "GET" && url.pathname === "/api/settings") {
+        sendJson(response, 200, {
+          ok: true,
+          settings: getSettings(database),
+        });
+        return;
+      }
+
+      if (request.method === "PUT" && url.pathname === "/api/settings") {
+        const payload = await readJsonBody(request);
+        const settings = saveSettings(
+          database,
+          payload.settings || payload
+        );
+
+        sendJson(response, 200, {
+          ok: true,
+          settings,
+        });
+        return;
+      }
+
+      if (
+        request.method === "POST" &&
+        url.pathname === "/api/settings/reset"
+      ) {
+        const settings = resetSettings(database);
+
+        sendJson(response, 200, {
+          ok: true,
+          settings,
+        });
+        return;
+      }
+
       if (request.method === "GET" && url.pathname === "/api/clients") {
         sendJson(response, 200, { ok: true, clients: getAllClients(database) });
         return;
*** End Patch
'@

$patchFile = Join-Path $env:TEMP "chrysalis-settings.patch"
Set-Content -Path $patchFile -Value $patch -Encoding utf8 -NoNewline

try {
    git apply --check $patchFile
    if ($LASTEXITCODE -ne 0) {
        throw "Patch validation failed. Nothing was changed."
    }

    git apply $patchFile
    if ($LASTEXITCODE -ne 0) {
        throw "Patch application failed. Restore the backup at $backup if required."
    }
}
finally {
    Remove-Item $patchFile -Force -ErrorAction SilentlyContinue
}

node --check server/index.js
if ($LASTEXITCODE -ne 0) {
    throw "Node syntax check failed. Restore the backup at $backup."
}

Write-Host ""
Write-Host "Settings database support installed successfully."
Write-Host "Backup: $backup"
Write-Host ""
Write-Host "Next: npm run server"
