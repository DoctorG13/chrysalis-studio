import { useEffect, useState } from "react";

export default function BackupTransferPanel() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/database/backups", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Unable to load backups (${response.status})`
        );
      }

      setBackups(Array.isArray(payload?.backups) ? payload.backups : []);
    } catch (loadError) {
      console.error("Unable to load portable backups.", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load backups."
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadLatestBackup() {
    if (downloadLoading || restoreLoading) return;

    try {
      setDownloadLoading(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/database/backups", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Unable to load backups (${response.status})`
        );
      }

      const availableBackups = Array.isArray(payload?.backups)
        ? payload.backups
        : [];

      setBackups(availableBackups);

      const latest = availableBackups[0];

      if (!latest?.id) {
        throw new Error(
          "There are no saved backups to download yet. Create a backup first."
        );
      }

      const anchor = document.createElement("a");
      anchor.href = `/api/database/backups/${encodeURIComponent(
        latest.id
      )}/download`;
      anchor.download = `${latest.label || latest.version || "chrysalis-backup"}.db`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setMessage(
        `${latest.label || latest.version || "Backup"} download started.`
      );
    } catch (downloadError) {
      console.error("Unable to download backup.", downloadError);
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download the backup."
      );
    } finally {
      setDownloadLoading(false);
    }
  }

  async function restoreFromFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || restoreLoading || downloadLoading) return;

    if (!file.name.toLowerCase().endsWith(".db")) {
      setError("Please choose a Chrysalis database backup (.db) file.");
      return;
    }

    const confirmed = window.confirm(
      "Restore this backup into Chrysalis? Your current workspace will be replaced. A safety backup of the current workspace will be created first."
    );

    if (!confirmed) return;

    try {
      setRestoreLoading(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/database/restore-upload", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Chrysalis-Filename": file.name,
        },
        body: file,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Restore failed (${response.status})`
        );
      }

      setMessage(
        "Backup restored successfully. Chrysalis will reload the workspace."
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (restoreError) {
      console.error("Unable to restore uploaded backup.", restoreError);
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore the uploaded backup."
      );
    } finally {
      setRestoreLoading(false);
    }
  }

  const latest = backups[0] || null;

  return (
    <section style={panelStyle} aria-label="Portable backup controls">
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>PORTABLE BACKUPS</div>
          <h3 style={titleStyle}>Backup & Restore</h3>
          <p style={descriptionStyle}>
            Keep an independent copy of your Chrysalis workspace and move it
            safely between computers or environments.
          </p>
        </div>
      </div>

      {(message || error) && (
        <div style={messageStyle(error)}>
          {message || error}
        </div>
      )}

      <div style={actionGridStyle}>
        <div style={actionCardStyle}>
          <div style={actionTitleStyle}>Download Backup</div>
          <div style={actionDescriptionStyle}>
            Downloads the latest saved database backup to your computer so you
            can keep an independent copy, transfer it to another computer, or
            provide it to your support or development team.
          </div>
          <button
            type="button"
            onClick={downloadLatestBackup}
            disabled={
              loading ||
              downloadLoading ||
              restoreLoading ||
              !latest
            }
            style={primaryButtonStyle}
          >
            {downloadLoading ? "Preparing..." : "Download Latest Backup"}
          </button>
          {!loading && !latest && (
            <div style={hintStyle}>
              Create a backup first. There is currently nothing to download.
            </div>
          )}
        </div>

        <div style={actionCardStyle}>
          <div style={actionTitleStyle}>Restore from Backup File</div>
          <div style={actionDescriptionStyle}>
            Restores Chrysalis from a database backup you have previously
            downloaded or transferred. The current workspace is replaced only
            after Chrysalis has created a safety backup first.
          </div>
          <label style={fileButtonStyle}>
            {restoreLoading ? "Restoring..." : "Choose Backup File"}
            <input
              type="file"
              accept=".db,application/octet-stream,application/x-sqlite3"
              onChange={restoreFromFile}
              disabled={downloadLoading || restoreLoading}
              style={{ display: "none" }}
            />
          </label>
          <div style={hintStyle}>
            Use a Chrysalis <strong>.db</strong> backup created by this
            application. Do not edit the database file manually.
          </div>
        </div>
      </div>

      <div style={explanationStyle}>
        <strong>What happens when you restore?</strong>
        <span>
          Chrysalis validates the backup, creates a safety copy of the current
          workspace, restores the selected data, and then reloads the
          application so the restored workspace becomes the active source of
          truth.
        </span>
      </div>

      <div style={archiveStyle}>
        <strong>About completed jobs</strong>
        <span>
          <strong>Collected</strong> is the normal end of a job workflow. The
          completed job remains available as business history. An optional
          future <strong>Archived</strong> state can be used to move older
          completed jobs out of day-to-day operational views, but archiving is
          not required to finish a job.
        </span>
      </div>
    </section>
  );
}

const panelStyle = {
  marginBottom: 14,
  padding: 16,
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  background: "#FFFFFF",
  boxShadow: "0 2px 8px rgba(0,0,0,.025)",
};

const headerStyle = {
  marginBottom: 12,
};

const eyebrowStyle = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1,
  color: "#8B1E3F",
  marginBottom: 4,
};

const titleStyle = {
  margin: 0,
  color: "#2F3A3F",
  fontSize: 20,
};

const descriptionStyle = {
  margin: "4px 0 0",
  color: "#777",
  fontSize: 12,
  lineHeight: 1.5,
  maxWidth: 900,
};

function messageStyle(error) {
  return {
    marginBottom: 12,
    padding: "9px 11px",
    borderRadius: 8,
    background: error ? "#FFF5F5" : "#F0FDF4",
    border: `1px solid ${error ? "#F0B4B4" : "#BBE7C6"}`,
    color: error ? "#B42318" : "#166534",
    fontSize: 12,
    fontWeight: 700,
  };
}

const actionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const actionCardStyle = {
  minWidth: 0,
  padding: 13,
  border: "1px solid #E5E7EB",
  borderRadius: 9,
  background: "#FAFAFA",
};

const actionTitleStyle = {
  color: "#2F3A3F",
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 5,
};

const actionDescriptionStyle = {
  color: "#697176",
  fontSize: 11,
  lineHeight: 1.5,
  minHeight: 66,
};

const primaryButtonStyle = {
  marginTop: 9,
  minHeight: 36,
  padding: "0 13px",
  border: "none",
  borderRadius: 8,
  background: "#8B1E3F",
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const fileButtonStyle = {
  ...primaryButtonStyle,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const hintStyle = {
  marginTop: 7,
  color: "#858B8F",
  fontSize: 10,
  lineHeight: 1.4,
};

const explanationStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  marginTop: 10,
  padding: "10px 11px",
  borderRadius: 8,
  background: "#F8F9FA",
  border: "1px solid #E5E7EB",
  color: "#697176",
  fontSize: 11,
  lineHeight: 1.5,
};

const archiveStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  marginTop: 8,
  padding: "10px 11px",
  borderRadius: 8,
  background: "#FFF8FA",
  border: "1px solid #E8B9C5",
  color: "#697176",
  fontSize: 11,
  lineHeight: 1.5,
};
