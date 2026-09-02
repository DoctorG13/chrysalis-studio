import { useEffect, useState } from "react";

const TEMP_BACKUP_MAX_AGE_DAYS = 30;
const TEMP_BACKUP_WARNING_DAYS = 3;

function getTemporaryBackupInfo(backup) {
  if (!backup?.id) return null;

  const id = String(backup.id);

  if (
    !id.includes("-before-client-delete-") &&
    !id.includes("-before-delete-client-")
  ) {
    return null;
  }

  const createdAt =
    backup.createdAt ||
    backup.modifiedAt ||
    null;

  if (!createdAt) return null;

  const createdTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdTime)) return null;

  const expiryTime =
    createdTime +
    TEMP_BACKUP_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const remainingMs = expiryTime - Date.now();

  const remainingDays = Math.ceil(
    remainingMs / (24 * 60 * 60 * 1000)
  );

  return {
    ...backup,
    expiryTime,
    remainingDays,
    expired: remainingMs <= 0,
    warning:
      remainingMs > 0 &&
      remainingDays <= TEMP_BACKUP_WARNING_DAYS,
  };
}

export default function Header({
  title = "Chrysalis Studio",
  searchQuery = "",
  onSearch,
  isDemoMode = false,
  onToggleDemo,
  user = "",
}) {
  const [backupWarning, setBackupWarning] =
    useState(null);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notificationDismissed, setNotificationDismissed] =
    useState(false);

  const [accountOpen, setAccountOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [logoutError, setLogoutError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkTemporaryBackups() {
      try {
        const response = await fetch(
          "/api/database/backups",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) return;

        const payload = await response.json();

        const backups = Array.isArray(payload?.backups)
          ? payload.backups
          : [];

        const warnings = backups
          .map(getTemporaryBackupInfo)
          .filter(
            (backup) =>
              backup &&
              !backup.expired &&
              backup.warning
          )
          .sort(
            (a, b) =>
              a.remainingDays -
              b.remainingDays
          );

        if (!cancelled) {
          setBackupWarning(
            warnings.length > 0
              ? warnings[0]
              : null
          );
        }
      } catch (error) {
        console.warn(
          "Unable to check temporary backup notifications.",
          error
        );
      }
    }

    checkTemporaryBackups();

    const interval = window.setInterval(
      checkTemporaryBackups,
      60 * 60 * 1000
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!backupWarning) {
      setNotificationDismissed(false);
    }
  }, [backupWarning]);

  const hasBackupWarning =
    Boolean(backupWarning) &&
    !notificationDismissed;

  function openNotifications() {
    setNotificationOpen((current) => !current);
  }

  function dismissBackupWarning() {
    setNotificationDismissed(true);
    setNotificationOpen(false);
  }

  function openAccountMenu() {
    setLogoutError("");
    setAccountOpen((current) => !current);
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setLogoutError("");
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));

        throw new Error(
          payload?.error || "Unable to sign out."
        );
      }

      window.location.reload();
    } catch (error) {
      setIsLoggingOut(false);
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out."
      );
    }
  }

  const warningDays =
    backupWarning?.remainingDays || 0;

  const warningText =
    warningDays === 1
      ? "1 day"
      : `${warningDays} days`;

  return (
    <div
      style={{
        width: "100%",
        background: "#FFFFFF",
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* =====================================================
          DEMO WORKSPACE BANNER
      ====================================================== */}
      {isDemoMode && (
        <div
          role="status"
          style={{
            width: "100%",
            boxSizing: "border-box",
            minHeight: 58,
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            background:
              "linear-gradient(90deg, #FFF0B8 0%, #FFD86A 50%, #FFF0B8 100%)",
            borderBottom:
              "1px solid #E7B84B",
            boxShadow:
              "0 2px 8px rgba(80,60,20,.10)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 0,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1F2933",
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              !
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                minWidth: 0,
                flexWrap: "wrap",
              }}
            >
              <strong
                style={{
                  color: "#1F2933",
                  fontSize: 15,
                  letterSpacing: 0.8,
                  whiteSpace: "nowrap",
                }}
              >
                DEMO WORKSPACE
              </strong>

              <span
                aria-hidden="true"
                style={{
                  color: "#80651C",
                  fontSize: 18,
                  fontWeight: 400,
                }}
              >
                |
              </span>

              <span
                style={{
                  color: "#4B4B35",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                You are viewing sample data for
                demonstration purposes.
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onToggleDemo}
              style={{
                border:
                  "1px solid #B98224",
                borderRadius: 10,
                background: "#FFF8E7",
                color: "#8B1E3F",
                padding:
                  "10px 16px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace:
                  "nowrap",
                boxShadow:
                  "0 1px 3px rgba(80,60,20,.10)",
              }}
            >
              ↪ Exit Demo &amp; Return to My Workspace
            </button>

            <button
              type="button"
              onClick={onToggleDemo}
              aria-label="Exit Demo Workspace"
              title="Exit Demo Workspace"
              style={{
                width: 34,
                height: 34,
                border: "none",
                borderRadius: 8,
                background:
                  "transparent",
                color: "#5B4A16",
                fontSize: 24,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          NORMAL APPLICATION HEADER
      ====================================================== */}
      <header
        style={{
          minHeight: 90,
          background: "#FFFFFF",
          borderBottom:
            "1px solid #E8E8E8",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          padding: "0 32px",
          gap: 24,
          boxSizing: "border-box",
        }}
      >
        {/* Page title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 0,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              color: "#2F3A3F",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h1>

          {isDemoMode && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding:
                  "6px 11px",
                borderRadius: 999,
                background:
                  "#FFF3D6",
                border:
                  "1px solid #F5C16C",
                color: "#805A12",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.7,
                whiteSpace:
                  "nowrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 12,
                }}
              >
                !
              </span>
              DEMO WORKSPACE
            </span>
          )}
        </div>

        {/* Search */}
        <div
          style={{
            flex: 1,
            maxWidth: 620,
            position: "relative",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              onSearch?.(
                event.target.value
              )
            }
            placeholder="Search clients, jobs, phone, email..."
            aria-label="Search clients, jobs, phone and email"
            style={{
              width: "100%",
              height: 46,
              borderRadius: 12,
              border:
                "1px solid #D9D9D9",
              padding:
                "0 16px",
              fontSize: 15,
              outline: "none",
              boxSizing:
                "border-box",
              background:
                "#FFFFFF",
              color: "#2F3A3F",
            }}
          />
        </div>

        {/* Header actions */}
        <div
          style={{
            display: "flex",
            gap: 14,
            flexShrink: 0,
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={openNotifications}
            style={{
              ...iconButton,
              position: "relative",
              border:
                hasBackupWarning
                  ? "1px solid #E7B84B"
                  : "none",
              background:
                hasBackupWarning
                  ? "#FFF7DF"
                  : "#F7F7F7",
            }}
            aria-label={
              hasBackupWarning
                ? "Notifications - backup warning"
                : "Notifications"
            }
            title={
              hasBackupWarning
                ? "Backup notification"
                : "Notifications"
            }
          >
            🔔

            {hasBackupWarning && (
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#C2410C",
                  border:
                    "2px solid #FFFFFF",
                  boxSizing: "content-box",
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={openAccountMenu}
            style={iconButton}
            aria-label="Account menu"
            title="Account"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
          >
            👤
          </button>

          {/* =================================================
              ACCOUNT MENU
          ================================================== */}
          {accountOpen && (
            <div
              role="menu"
              aria-label="Account"
              style={{
                position: "absolute",
                top: 56,
                right: 0,
                width: 250,
                maxWidth: "calc(100vw - 40px)",
                background: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: 14,
                boxShadow:
                  "0 16px 40px rgba(30,35,40,.16)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "15px 16px",
                  borderBottom: "1px solid #EEEEEE",
                }}
              >
                <div
                  style={{
                    color: "#777777",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    marginBottom: 5,
                  }}
                >
                  Signed in as
                </div>

                <div
                  style={{
                    color: "#2F3A3F",
                    fontSize: 14,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user || "Authenticated user"}
                </div>
              </div>

              {logoutError && (
                <div
                  role="alert"
                  style={{
                    margin: "12px 12px 0",
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: "1px solid #E5B5B5",
                    background: "#FFF4F4",
                    color: "#8B2E2E",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {logoutError}
                </div>
              )}

              <div style={{ padding: 12 }}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  style={{
                    width: "100%",
                    minHeight: 42,
                    border: "1px solid #E5D1D7",
                    borderRadius: 9,
                    background: "#FFF8FA",
                    color: "#8B1E3F",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isLoggingOut
                      ? "wait"
                      : "pointer",
                    opacity: isLoggingOut ? 0.75 : 1,
                  }}
                >
                  {isLoggingOut ? "Signing out..." : "Log out"}
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              NOTIFICATION PANEL
          ================================================== */}
          {notificationOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              style={{
                position: "absolute",
                top: 56,
                right: 58,
                width: 390,
                maxWidth:
                  "calc(100vw - 40px)",
                background: "#FFFFFF",
                border:
                  "1px solid #E5E5E5",
                borderRadius: 16,
                boxShadow:
                  "0 16px 40px rgba(30,35,40,.16)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding:
                    "16px 18px",
                  borderBottom:
                    "1px solid #EEEEEE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 12,
                }}
              >
                <strong
                  style={{
                    color: "#2F3A3F",
                    fontSize: 16,
                  }}
                >
                  Notifications
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    setNotificationOpen(false)
                  }
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    color: "#777777",
                    fontSize: 20,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                  aria-label="Close notifications"
                >
                  ×
                </button>
              </div>

              {backupWarning ? (
                <div
                  style={{
                    padding: 18,
                    background:
                      "#FFF9EA",
                    borderBottom:
                      "1px solid #F2E2B5",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems:
                        "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        flexShrink: 0,
                        borderRadius:
                          "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        background:
                          "#FFE7A8",
                        fontSize: 19,
                      }}
                    >
                      ⚠️
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          display:
                            "block",
                          color:
                            "#6B4F12",
                          fontSize: 14,
                          marginBottom: 6,
                        }}
                      >
                        Temporary backup expires soon
                      </strong>

                      <div
                        style={{
                          color:
                            "#5B5547",
                          fontSize: 13,
                          lineHeight:
                            1.5,
                        }}
                      >
                        A safety backup from a
                        deleted client will be
                        automatically removed in{" "}
                        <strong>
                          {warningText}
                        </strong>
                        .
                      </div>

                      <div
                        style={{
                          marginTop: 9,
                          padding:
                            "8px 10px",
                          borderRadius: 8,
                          background:
                            "#FFFFFF",
                          border:
                            "1px solid #EEDDAE",
                          color:
                            "#6B6250",
                          fontSize: 12,
                          lineHeight:
                            1.4,
                        }}
                      >
                        The backup is temporary by
                        design. If you need to keep
                        it permanently, use{" "}
                        <strong>
                          Settings → Data &amp; Backup
                        </strong>{" "}
                        to create a normal saved
                        backup.
                      </div>

                      <button
                        type="button"
                        onClick={
                          dismissBackupWarning
                        }
                        style={{
                          marginTop: 12,
                          border:
                            "1px solid #C8A548",
                          borderRadius: 9,
                          background:
                            "#FFFFFF",
                          color: "#6B4F12",
                          padding:
                            "8px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor:
                            "pointer",
                        }}
                      >
                        Dismiss notification
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding:
                      "28px 20px",
                    textAlign:
                      "center",
                    color: "#777777",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      fontSize: 25,
                      marginBottom: 8,
                    }}
                  >
                    ✓
                  </div>
                  No new notifications
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

const iconButton = {
  width: 44,
  height: 44,
  borderRadius: 10,
  border: "none",
  background: "#F7F7F7",
  cursor: "pointer",
  fontSize: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
