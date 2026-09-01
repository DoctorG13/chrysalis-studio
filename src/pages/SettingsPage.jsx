import { useEffect, useRef, useState } from "react";
import { ThriveDialog, useThriveDialog } from "../components/common/ThriveDialog.jsx";

const DEFAULT_SETTINGS = {
  business: {
    businessName: "Chrysalis Studio",
    ownerName: "Donna",
    slogan: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    abn: "",
    logo: "",
    primaryColour: "#8B1E3F",
    secondaryColour: "#2F3A3F",
    accentColour: "#C96A83",
    actionButtonStyle: "vibrant",
  },

  financial: {
    gstRate: 10,
    depositPercent: 25,
    paymentTerms: 14,
    currency: "AUD",
  },

  quotesInvoices: {
    quoteValidityDays: 30,
    invoicePrefix: "INV",
    quotePrefix: "QUO",
    paymentInstructions: "",
    terms: "",
  },

  jobs: {
    referencePrefix: "CHR",
    defaultStatus: "Quote",
    defaultPriority: "Normal",
    workflowStages:
      "Quote, Cutting, Sewing, Fitting, Finishing, Completed, Collected",
  },

  calendar: {
    workingDays:
      "Monday, Tuesday, Wednesday, Thursday, Friday",
    openingTime: "09:00",
    closingTime: "17:00",
    defaultAppointmentDuration: 60,
  },

  production: {
    garmentCategories:
      "Wedding Dress, Formal Dress, Alteration, Other",
    productionStages:
      "Quote, Cutting, Sewing, Fitting, Finishing, Completed",
    measurementUnit: "cm",
  },
};

const SECTIONS = [
  [
    "business",
    "Business",
    "Business identity and contact details",
  ],
  [
    "branding",
    "Branding",
    "Logo and studio colour identity",
  ],
  [
    "financial",
    "Financial",
    "GST, deposits and payment defaults",
  ],
  [
    "quotesInvoices",
    "Quotes & Invoices",
    "Document numbering and client-facing defaults",
  ],
  [
    "jobs",
    "Jobs & Workflow",
    "Job references, statuses and workflow stages",
  ],
  [
    "calendar",
    "Calendar",
    "Working hours and appointment defaults",
  ],
  [
    "production",
    "Production",
    "Garment categories and production stages",
  ],
  [
    "data",
    "Data & Backup",
    "Database settings and configuration tools",
  ],
  [
    "about",
    "About",
    "Chrysalis Studio version and architecture",
  ],
];

function mergeSettings(saved) {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,

    business: {
      ...DEFAULT_SETTINGS.business,
      ...(saved?.business || {}),
    },

    financial: {
      ...DEFAULT_SETTINGS.financial,
      ...(saved?.financial || {}),
    },

    quotesInvoices: {
      ...DEFAULT_SETTINGS.quotesInvoices,
      ...(saved?.quotesInvoices || {}),
    },

    jobs: {
      ...DEFAULT_SETTINGS.jobs,
      ...(saved?.jobs || {}),
    },

    calendar: {
      ...DEFAULT_SETTINGS.calendar,
      ...(saved?.calendar || {}),
    },

    production: {
      ...DEFAULT_SETTINGS.production,
      ...(saved?.production || {}),
    },
  };
}

export default function SettingsPage({
  onSettingsSaved,
  onClose,
  onStartFresh,
  isDemoMode = false,
  onToggleDemo,
}) {
  const [activeSection, setActiveSection] =
    useState("business");

  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [savedSettings, setSavedSettings] =
    useState(DEFAULT_SETTINGS);

  const hasUnsavedChanges =
    JSON.stringify(settings) !==
    JSON.stringify(savedSettings);

  const [savedMessage, setSavedMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const fileInputRef = useRef(null);

  const [setupGuideOpen, setSetupGuideOpen] =
    useState(false);

  const [backupLoading, setBackupLoading] =
    useState(false);

  const [startFreshLoading, setStartFreshLoading] =
    useState(false);

  const [backupHistory, setBackupHistory] =
    useState([]);

  const [backupHistoryLoading, setBackupHistoryLoading] =
    useState(false);

  const [restoreLoading, setRestoreLoading] =
    useState("");

  const [backupMutationLoading, setBackupMutationLoading] =
    useState("");

  const [editingBackupId, setEditingBackupId] =
    useState("");

  const [editingBackupName, setEditingBackupName] =
    useState("");

  const [backupPanelOpen, setBackupPanelOpen] =
    useState(false);

  const [backupSearch, setBackupSearch] =
    useState("");

  const { confirm, prompt, dialogProps } =
    useThriveDialog();

  useEffect(() => {
    loadBackupHistory();
  }, []);

  useEffect(() => {
    if (!backupPanelOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setBackupPanelOpen(false);
        setEditingBackupId("");
        setEditingBackupName("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [backupPanelOpen]);

  async function loadBackupHistory(fallbackBackup = null) {
    try {
      setBackupHistoryLoading(true);

      const response = await fetch(
        "/api/database/backups"
      );

      if (!response.ok) {
        throw new Error(
          `Backup history request failed (${response.status})`
        );
      }

      const payload = await response.json();
      const history = Array.isArray(payload?.backups)
        ? payload.backups
        : [];

      if (fallbackBackup?.id) {
        setBackupHistory([
          fallbackBackup,
          ...history.filter(
            (backup) => backup.id !== fallbackBackup.id
          ),
        ]);
      } else {
        setBackupHistory(history);
      }
    } catch (error) {
      console.error(
        "Unable to load backup history.",
        error
      );

      if (fallbackBackup?.id) {
        setBackupHistory((current) => [
          fallbackBackup,
          ...current.filter(
            (backup) => backup.id !== fallbackBackup.id
          ),
        ]);
      }
    } finally {
      setBackupHistoryLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          "/api/settings"
        );

        if (!response.ok) {
          throw new Error(
            `Settings request failed (${response.status})`
          );
        }

        const payload =
          await response.json();

        if (cancelled) return;

        const loadedSettings =
          mergeSettings(payload?.settings);

        setSettings(loadedSettings);
        setSavedSettings(loadedSettings);
      } catch (error) {
        console.error(
          "Unable to load Chrysalis settings.",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            "Unable to load settings from the Chrysalis database."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function update(section, field, value) {
    setSettings((current) => ({
      ...current,

      [section]: {
        ...current[section],
        [field]: value,
      },
    }));

    setSavedMessage("");
  }

  async function saveSettings() {
    try {
      setSavedMessage("");
      setErrorMessage("");

      const response = await fetch(
        "/api/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settings,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Settings save failed (${response.status})`
        );
      }

      const payload =
        await response.json();

      const savedSettings = mergeSettings(
        payload?.settings || settings
      );

      setSettings(savedSettings);
      setSavedSettings(savedSettings);

      setSavedMessage(
        "Settings saved to the database."
      );

      onSettingsSaved?.(savedSettings);

      window.setTimeout(
        () => setSavedMessage(""),
        2500
      );
    } catch (error) {
      console.error(
        "Unable to save Chrysalis settings.",
        error
      );

      setErrorMessage(
        "Unable to save settings to the Chrysalis database."
      );
    }
  }

  async function closeSettings() {
    if (hasUnsavedChanges) {
      const confirmed = await confirm({
        title: "Close Settings?",
        message:
          "Any changes you made will be lost if you close without saving.",
        confirmLabel: "Close Without Saving",
        cancelLabel: "Keep Editing",
        danger: true,
      });

      if (!confirmed) return;
    }

    setSavedMessage("");
    setErrorMessage("");

    onClose?.();
  }

  async function resetSettings() {
    const confirmed = await confirm({
      title: "Reset Settings?",
      message:
        "All configurable settings will be returned to their original Chrysalis defaults. Your business data will not be removed.",
      confirmLabel: "Reset Settings",
      cancelLabel: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    try {
      setSavedMessage("");
      setErrorMessage("");

      const response = await fetch(
        "/api/settings/reset",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Settings reset failed (${response.status})`
        );
      }

      const payload =
        await response.json();

      const reset =
        mergeSettings(payload?.settings);

      setSettings(reset);
      setSavedSettings(reset);

      setSavedMessage(
        "Settings reset to defaults."
      );

      onSettingsSaved?.(reset);
    } catch (error) {
      console.error(
        "Unable to reset Chrysalis settings.",
        error
      );

      setErrorMessage(
        "Unable to reset settings."
      );
    }
  }

  function getNextBackupName() {
    const versionNumbers = backupHistory
      .map((backup) => Number(backup?.versionNumber))
      .filter((version) => Number.isInteger(version) && version > 0);

    const nextVersion =
      versionNumbers.length > 0
        ? Math.max(...versionNumbers) + 1
        : 1;

    return `Version ${String(nextVersion).padStart(3, "0")}`;
  }

  async function backupDatabase() {
    if (backupLoading || startFreshLoading) return;

    const suggestedName = getNextBackupName();
    const requestedName = await prompt({
      title: "Name This Backup",
      message:
        "Give this saved workspace version a name. You can rename it later from Saved Versions.",
      defaultValue: suggestedName,
      confirmLabel: "Save Backup",
      cancelLabel: "Cancel",
      inputLabel: "Backup name",
    });

    if (requestedName === null) return;

    const backupName =
      requestedName.trim() || suggestedName;

    try {
      setBackupLoading(true);
      setSavedMessage("");
      setErrorMessage("");

      const response = await fetch(
        "/api/database/backup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: backupName,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Database backup failed (${response.status})`
        );
      }

      if (Array.isArray(payload?.backups)) {
        setBackupHistory(payload.backups);
      } else {
        await loadBackupHistory(payload?.backup || null);
      }

      setBackupPanelOpen(true);

      setSavedMessage(
        payload?.backup?.label
          ? `Backup ${payload.backup.label} created.`
          : "Backup created successfully."
      );
    } catch (error) {
      console.error(
        "Unable to create database backup.",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the database backup."
      );
    } finally {
      setBackupLoading(false);
    }
  }

  async function restoreBackup(backup) {
    if (
      backupLoading ||
      startFreshLoading ||
      restoreLoading
    ) {
      return;
    }

    const confirmed = await confirm({
      title: `Restore ${backup.name || backup.label}?`,
      message:
        "Your current workspace will be replaced by this saved version. A safety backup of your current workspace will be created first.",
      confirmLabel: "Restore Version",
      cancelLabel: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    try {
      setRestoreLoading(backup.id);
      setSavedMessage("");
      setErrorMessage("");

      const response = await fetch(
        `/api/database/restore/${encodeURIComponent(backup.id)}`,
        { method: "POST" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Restore failed (${response.status})`
        );
      }

      const restoredSettings = mergeSettings(
        payload?.settings
      );

      setSettings(restoredSettings);
      setSavedSettings(restoredSettings);

      await loadBackupHistory();

      setSavedMessage(
        `${backup.label} restored successfully.`
      );

      onSettingsSaved?.(restoredSettings);
    } catch (error) {
      console.error(
        "Unable to restore the selected backup.",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to restore the selected backup."
      );
    } finally {
      setRestoreLoading("");
    }
  }

  function beginBackupRename(backup) {
    if (backupMutationLoading || restoreLoading) return;

    setEditingBackupId(backup.id);
    setEditingBackupName(backup.name || "");
    setSavedMessage("");
    setErrorMessage("");
  }

  function cancelBackupRename() {
    setEditingBackupId("");
    setEditingBackupName("");
  }

  async function saveBackupName(backup) {
    if (backupMutationLoading || restoreLoading) return;

    try {
      setBackupMutationLoading(backup.id);
      setSavedMessage("");
      setErrorMessage("");

      const response = await fetch(
        `/api/database/backups/${encodeURIComponent(backup.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingBackupName,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Unable to rename backup (${response.status})`
        );
      }

      setBackupHistory(
        Array.isArray(payload?.backups)
          ? payload.backups
          : backupHistory
      );
      setEditingBackupId("");
      setEditingBackupName("");
      setSavedMessage("Backup name updated.");
    } catch (error) {
      console.error("Unable to rename backup.", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to rename backup."
      );
    } finally {
      setBackupMutationLoading("");
    }
  }

  async function deleteBackup(backup) {
    if (backupMutationLoading || restoreLoading) return;

    const confirmed = await confirm({
      title: `Delete ${backup.name || backup.label}?`,
      message:
        "This saved version will be permanently removed. This action cannot be undone.",
      confirmLabel: "Delete Backup",
      cancelLabel: "Keep Backup",
      danger: true,
    });

    if (!confirmed) return;

    try {
      setBackupMutationLoading(backup.id);
      setSavedMessage("");
      setErrorMessage("");

      const response = await fetch(
        `/api/database/backups/${encodeURIComponent(backup.id)}`,
        { method: "DELETE" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Unable to delete backup (${response.status})`
        );
      }

      setBackupHistory(
        Array.isArray(payload?.backups)
          ? payload.backups
          : []
      );
      setSavedMessage(`${backup.label} deleted.`);
    } catch (error) {
      console.error("Unable to delete backup.", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete backup."
      );
    } finally {
      setBackupMutationLoading("");
    }
  }

  async function startFresh() {
    if (backupLoading || startFreshLoading) return;

    const confirmed = await confirm({
      title: "Start Fresh?",
      message:
        "This will remove all clients and their related business data from the current workspace. A database backup will be created first. This action cannot be undone from the workspace itself.",
      confirmLabel: "Start Fresh",
      cancelLabel: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    try {
      setStartFreshLoading(true);
      setSavedMessage("");
      setErrorMessage("");

      const backupResponse = await fetch(
        "/api/database/backup",
        { method: "POST" }
      );

      if (!backupResponse.ok) {
        throw new Error(
          `Database backup failed (${backupResponse.status})`
        );
      }

      if (!onStartFresh) {
        throw new Error(
          "Start Fresh is not available in this workspace."
        );
      }

      await onStartFresh();

      setSavedMessage(
        "Workspace cleared. Your database backup was created first."
      );
    } catch (error) {
      console.error(
        "Unable to start a fresh workspace.",
        error
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start a fresh workspace."
      );
    } finally {
      setStartFreshLoading(false);
    }
  }

  function exportSettings() {
    const blob = new Blob(
      [JSON.stringify(settings, null, 2)],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "chrysalis-settings.json";

    anchor.click();

    URL.revokeObjectURL(url);
  }

  async function handleLogoSelect(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please choose an image file for the studio logo."
      );

      event.target.value = "";
      return;
    }

    try {
      setErrorMessage("");

      const result =
        await prepareLogoForStorage(file);

      update(
        "business",
        "logo",
        result
      );
    } catch (error) {
      console.error(
        "Unable to prepare the selected studio logo.",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to prepare the selected logo."
      );
    } finally {
      event.target.value = "";
    }
  }

async function prepareLogoForStorage(file) {
  const MAX_STORED_BYTES = 650 * 1024;
  const MAX_DIMENSION = 1200;

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("Unable to decode the selected logo."));
      image.src = objectUrl;
    });

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("The selected logo has no usable image dimensions.");
    }

    const scale = Math.min(
      1,
      MAX_DIMENSION / sourceWidth,
      MAX_DIMENSION / sourceHeight
    );

    const width = Math.max(
      1,
      Math.round(sourceWidth * scale)
    );

    const height = Math.max(
      1,
      Math.round(sourceHeight * scale)
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Your browser could not prepare the selected logo.");
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    /*
     * WebP keeps transparent logos transparent while producing a
     * much smaller data URL than the original upload in most cases.
     */
    let quality = 0.9;
    let dataUrl = canvas.toDataURL(
      "image/webp",
      quality
    );

    while (
      dataUrl.length * 0.75 > MAX_STORED_BYTES &&
      quality > 0.45
    ) {
      quality -= 0.1;

      dataUrl = canvas.toDataURL(
        "image/webp",
        quality
      );
    }

    /*
     * If the browser cannot encode WebP, fall back to PNG and
     * enforce the same safety limit before returning it.
     */
    if (
      !dataUrl.startsWith("data:image/webp")
    ) {
      dataUrl = canvas.toDataURL("image/png");
    }

    const approximateBytes =
      Math.ceil(
        (dataUrl.length -
          dataUrl.indexOf(",") -
          1) *
          0.75
      );

    if (approximateBytes > MAX_STORED_BYTES) {
      throw new Error(
        "The selected logo could not be reduced enough to save safely. Please choose a smaller logo image."
      );
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

  function removeLogo() {
    update(
      "business",
      "logo",
      ""
    );
  }

  function renderSection() {
    switch (activeSection) {
      case "business":
        return (
          <SettingsSection
            title="Business Profile"
            description="These details can be used as the studio's default business identity."
          >
            <Field label="Business Name">
              <Input
                value={
                  settings.business.businessName
                }
                onChange={(value) =>
                  update(
                    "business",
                    "businessName",
                    value
                  )
                }
              />
            </Field>

            <Field label="Owner / Contact Name">
              <Input
                value={
                  settings.business.ownerName
                }
                onChange={(value) =>
                  update(
                    "business",
                    "ownerName",
                    value
                  )
                }
              />
            </Field>

            <Field label="Business Address">
              <TextArea
                value={
                  settings.business.address
                }
                onChange={(value) =>
                  update(
                    "business",
                    "address",
                    value
                  )
                }
                rows={3}
              />
            </Field>

            <Field label="Phone">
              <Input
                value={
                  settings.business.phone
                }
                onChange={(value) =>
                  update(
                    "business",
                    "phone",
                    value
                  )
                }
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={
                  settings.business.email
                }
                onChange={(value) =>
                  update(
                    "business",
                    "email",
                    value
                  )
                }
              />
            </Field>

            <Field label="Website">
              <Input
                value={
                  settings.business.website
                }
                onChange={(value) =>
                  update(
                    "business",
                    "website",
                    value
                  )
                }
              />
            </Field>

            <Field label="ABN">
              <Input
                value={
                  settings.business.abn
                }
                onChange={(value) =>
                  update(
                    "business",
                    "abn",
                    value
                  )
                }
              />
            </Field>
          </SettingsSection>
        );

      case "branding":
        return (
          <SettingsSection
            title="Branding"
            description="Define the visual identity used throughout Chrysalis Studio."
          >
            <div
              style={brandingLogoCardStyle}
            >
              <div>
                <div style={brandingTitleStyle}>
                  Studio Logo
                </div>

                <div
                  style={brandingDescriptionStyle}
                >
                  Upload the logo you want to
                  use for your studio. PNG,
                  JPEG, SVG and other standard
                  image formats are supported.
                </div>
              </div>

              <div
                style={logoPreviewAreaStyle}
              >
                {settings.business.logo ? (
                  <div
                    style={
                      logoPreviewWrapperStyle
                    }
                  >
                    <img
                      src={
                        settings.business.logo
                      }
                      alt="Studio logo preview"
                      style={logoPreviewStyle}
                    />
                  </div>
                ) : (
                  <div
                    style={
                      emptyLogoStyle
                    }
                  >
                    <span>
                      No logo uploaded
                    </span>
                  </div>
                )}

                <div
                  style={
                    logoActionsStyle
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    style={secondaryButton}
                  >
                    {settings.business.logo
                      ? "Replace Logo"
                      : "Upload Logo"}
                  </button>

                  {settings.business.logo && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      style={dangerButton}
                    >
                      Remove Logo
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={
                      handleLogoSelect
                    }
                    style={{
                      display: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            <Field label="Business Slogan (optional)">
              <Input
                value={
                  settings.business.slogan
                }
                onChange={(value) =>
                  update(
                    "business",
                    "slogan",
                    value
                  )
                }
                placeholder="e.g. Making your business work for you."
              />
            </Field>

            <InfoBox>
              Add a short tagline for your business if
              you want one. Leave this blank if you
              prefer to show no business tagline.
            </InfoBox>

            <ColourField
              label="Primary Colour"
              description="Main brand colour used for primary actions and active elements."
              value={
                settings.business
                  .primaryColour
              }
              onChange={(value) =>
                update(
                  "business",
                  "primaryColour",
                  value
                )
              }
            />

            <ColourField
              label="Secondary Colour"
              description="Supporting colour used for headings, secondary interface elements and contrast."
              value={
                settings.business
                  .secondaryColour
              }
              onChange={(value) =>
                update(
                  "business",
                  "secondaryColour",
                  value
                )
              }
            />

            <ColourField
              label="Accent Colour"
              description="Highlight colour used for borders, secondary actions and visual accents."
              value={
                settings.business
                  .accentColour
              }
              onChange={(value) =>
                update(
                  "business",
                  "accentColour",
                  value
                )
              }
            />

            <Field label="Action Button Style">
              <Select
                value={
                  settings.business.actionButtonStyle ||
                  "vibrant"
                }
                onChange={(value) =>
                  update(
                    "business",
                    "actionButtonStyle",
                    value
                  )
                }
                options={[
                  ["vibrant", "Vibrant — standout colours"],
                  ["classic", "Classic — restrained"],
                  ["soft", "Soft — lighter colours"],
                ]}
              />
            </Field>

            <InfoBox>
              Choose how action buttons appear throughout the workspace.
              Vibrant is recommended when you want important actions to
              stand out clearly.
            </InfoBox>

            <BrandPreview
              settings={settings}
            />

            <InfoBox>
              Branding changes are saved to
              the Chrysalis SQLite database.
              The colours will be applied
              throughout the application in
              the next branding step.
            </InfoBox>
          </SettingsSection>
        );

      case "financial":
        return (
          <SettingsSection
            title="Financial Settings"
            description="Default financial rules used throughout Finance."
          >
            <Field label="GST Rate (%)">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={
                  settings.financial.gstRate
                }
                onChange={(value) =>
                  update(
                    "financial",
                    "gstRate",
                    value
                  )
                }
              />
            </Field>

            <Field label="Default Deposit (%)">
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={
                  settings.financial
                    .depositPercent
                }
                onChange={(value) =>
                  update(
                    "financial",
                    "depositPercent",
                    value
                  )
                }
              />
            </Field>

            <Field label="Default Payment Terms (days)">
              <Input
                type="number"
                min="0"
                step="1"
                value={
                  settings.financial
                    .paymentTerms
                }
                onChange={(value) =>
                  update(
                    "financial",
                    "paymentTerms",
                    value
                  )
                }
              />
            </Field>

            <Field label="Currency">
              <Select
                value={
                  settings.financial.currency
                }
                onChange={(value) =>
                  update(
                    "financial",
                    "currency",
                    value
                  )
                }
                options={[
                  [
                    "AUD",
                    "AUD - Australian Dollar",
                  ],
                  [
                    "NZD",
                    "NZD - New Zealand Dollar",
                  ],
                  [
                    "USD",
                    "USD - US Dollar",
                  ],
                  [
                    "GBP",
                    "GBP - British Pound",
                  ],
                  [
                    "EUR",
                    "EUR - Euro",
                  ],
                ]}
              />
            </Field>
          </SettingsSection>
        );

      case "quotesInvoices":
        return (
          <SettingsSection
            title="Quotes & Invoices"
            description="Control the defaults used when creating financial documents."
          >
            <Field label="Quote Number Prefix">
              <Input
                value={
                  settings.quotesInvoices
                    .quotePrefix
                }
                onChange={(value) =>
                  update(
                    "quotesInvoices",
                    "quotePrefix",
                    value
                  )
                }
              />
            </Field>

            <Field label="Invoice Number Prefix">
              <Input
                value={
                  settings.quotesInvoices
                    .invoicePrefix
                }
                onChange={(value) =>
                  update(
                    "quotesInvoices",
                    "invoicePrefix",
                    value
                  )
                }
              />
            </Field>

            <Field label="Default Quote Validity (days)">
              <Input
                type="number"
                min="0"
                value={
                  settings.quotesInvoices
                    .quoteValidityDays
                }
                onChange={(value) =>
                  update(
                    "quotesInvoices",
                    "quoteValidityDays",
                    value
                  )
                }
              />
            </Field>

            <Field label="Payment Instructions">
              <TextArea
                value={
                  settings.quotesInvoices
                    .paymentInstructions
                }
                onChange={(value) =>
                  update(
                    "quotesInvoices",
                    "paymentInstructions",
                    value
                  )
                }
                rows={4}
                placeholder="Bank details, payment methods or other instructions"
              />
            </Field>

            <Field label="Terms & Conditions">
              <TextArea
                value={
                  settings.quotesInvoices.terms
                }
                onChange={(value) =>
                  update(
                    "quotesInvoices",
                    "terms",
                    value
                  )
                }
                rows={6}
                placeholder="Default quote and invoice terms"
              />
            </Field>
          </SettingsSection>
        );

      case "jobs":
        return (
          <SettingsSection
            title="Jobs & Workflow"
            description="Define the defaults used by the job management system."
          >
            <Field label="Job Reference Prefix">
              <Input
                value={
                  settings.jobs.referencePrefix
                }
                onChange={(value) =>
                  update(
                    "jobs",
                    "referencePrefix",
                    value
                  )
                }
              />
            </Field>

            <Field label="Default Job Status">
              <Select
                value={
                  settings.jobs.defaultStatus
                }
                onChange={(value) =>
                  update(
                    "jobs",
                    "defaultStatus",
                    value
                  )
                }
                options={[
                  ["Quote", "Quote"],
                  [
                    "In Progress",
                    "In Progress",
                  ],
                  [
                    "Awaiting Fitting",
                    "Awaiting Fitting",
                  ],
                  [
                    "Completed",
                    "Completed",
                  ],
                  [
                    "Collected",
                    "Collected",
                  ],
                ]}
              />
            </Field>

            <Field label="Default Priority">
              <Select
                value={
                  settings.jobs.defaultPriority
                }
                onChange={(value) =>
                  update(
                    "jobs",
                    "defaultPriority",
                    value
                  )
                }
                options={[
                  ["Low", "Low"],
                  ["Normal", "Normal"],
                  ["High", "High"],
                  ["Urgent", "Urgent"],
                ]}
              />
            </Field>

            <Field label="Workflow Stages">
              <TextArea
                value={
                  settings.jobs.workflowStages
                }
                onChange={(value) =>
                  update(
                    "jobs",
                    "workflowStages",
                    value
                  )
                }
                rows={4}
              />
            </Field>

            <InfoBox>
              Enter workflow stages as a
              comma-separated list.
            </InfoBox>
          </SettingsSection>
        );

      case "calendar":
        return (
          <SettingsSection
            title="Calendar Settings"
            description="Set the studio's normal working hours and appointment defaults."
          >
            <Field label="Working Days">
              <TextArea
                value={
                  settings.calendar.workingDays
                }
                onChange={(value) =>
                  update(
                    "calendar",
                    "workingDays",
                    value
                  )
                }
                rows={3}
              />
            </Field>

            <Field label="Opening Time">
              <Input
                type="time"
                value={
                  settings.calendar.openingTime
                }
                onChange={(value) =>
                  update(
                    "calendar",
                    "openingTime",
                    value
                  )
                }
              />
            </Field>

            <Field label="Closing Time">
              <Input
                type="time"
                value={
                  settings.calendar.closingTime
                }
                onChange={(value) =>
                  update(
                    "calendar",
                    "closingTime",
                    value
                  )
                }
              />
            </Field>

            <Field label="Default Appointment Duration (minutes)">
              <Input
                type="number"
                min="15"
                step="15"
                value={
                  settings.calendar
                    .defaultAppointmentDuration
                }
                onChange={(value) =>
                  update(
                    "calendar",
                    "defaultAppointmentDuration",
                    value
                  )
                }
              />
            </Field>
          </SettingsSection>
        );

      case "production":
        return (
          <SettingsSection
            title="Production Settings"
            description="Configure the terminology and defaults used by Garments and the Production Board."
          >
            <Field label="Garment Categories">
              <TextArea
                value={
                  settings.production
                    .garmentCategories
                }
                onChange={(value) =>
                  update(
                    "production",
                    "garmentCategories",
                    value
                  )
                }
                rows={4}
              />
            </Field>

            <Field label="Production Stages">
              <TextArea
                value={
                  settings.production
                    .productionStages
                }
                onChange={(value) =>
                  update(
                    "production",
                    "productionStages",
                    value
                  )
                }
                rows={4}
              />
            </Field>

            <Field label="Measurement Unit">
              <Select
                value={
                  settings.production
                    .measurementUnit
                }
                onChange={(value) =>
                  update(
                    "production",
                    "measurementUnit",
                    value
                  )
                }
                options={[
                  [
                    "cm",
                    "Centimetres (cm)",
                  ],
                  [
                    "in",
                    "Inches (in)",
                  ],
                ]}
              />
            </Field>
          </SettingsSection>
        );

      case "data":
        return (
          <SettingsSection
            title="Workspace & Data"
            description="Manage your workspace, backups and settings."
          >
            <ActionRow
              title="Demo Workspace"
              variant="demo"
              description={
                isDemoMode
                  ? "Sample data is active. Explore THRIVE safely."
                  : "Explore THRIVE using safe sample data."
              }
              buttonLabel={
                isDemoMode
                  ? "Exit Demo"
                  : "Enter Demo"
              }
              onClick={onToggleDemo}
              disabled={
                backupLoading ||
                startFreshLoading ||
                !!restoreLoading ||
                !onToggleDemo
              }
              buttonStyle={settings.business.actionButtonStyle}
            />

            <ActionRow
              title="Create a Backup"
              variant="backup"
              description="Save a named copy of your current workspace."
              buttonLabel={
                backupLoading
                  ? "Creating..."
                  : "Create Backup"
              }
              onClick={backupDatabase}
              disabled={
                backupLoading ||
                startFreshLoading ||
                !!restoreLoading
              }
              buttonStyle={settings.business.actionButtonStyle}
            />

            <ActionRow
              title="Saved Versions"
              variant="saved"
              description={
                backupHistory.length > 0
                  ? `${backupHistory.length} saved ${
                      backupHistory.length === 1
                        ? "version"
                        : "versions"
                    } available to restore.`
                  : "No saved versions yet."
              }
              buttonLabel="View Backups →"
              onClick={() => {
                setBackupSearch("");
                setBackupPanelOpen(true);
                loadBackupHistory();
              }}
              disabled={
                backupLoading ||
                startFreshLoading ||
                !!restoreLoading
              }
              buttonStyle={settings.business.actionButtonStyle}
            />

            <ActionRow
              title="Export Settings"
              variant="export"
              description="Save your current settings as a file."
              buttonLabel="Export"
              onClick={exportSettings}
              disabled={
                backupLoading ||
                startFreshLoading ||
                !!restoreLoading
              }
              buttonStyle={settings.business.actionButtonStyle}
            />

            <ActionRow
              title="Reset Settings"
              variant="reset"
              description="Return your settings to their original defaults. Your business data stays safe."
              buttonLabel="Reset"
              onClick={resetSettings}
              danger
              disabled={
                backupLoading ||
                startFreshLoading ||
                !!restoreLoading
              }
              buttonStyle={settings.business.actionButtonStyle}
            />

            <ActionRow
              title="Start Fresh"
              variant="danger"
              description="Create a safety backup, then clear your workspace so you can begin again."
              buttonLabel={
                startFreshLoading
                  ? "Starting..."
                  : "Start Fresh"
              }
              onClick={startFresh}
              danger
              disabled={
                backupLoading ||
                startFreshLoading ||
                !!restoreLoading
              }
              buttonStyle={settings.business.actionButtonStyle}
            />
          </SettingsSection>
        );

      case "about":
        return (
          <SettingsSection
            title="About Chrysalis Studio"
            description="System information for the current application."
          >
            <div style={aboutGrid}>
              <AboutItem
                label="Application"
                value="Chrysalis Studio"
              />

              <AboutItem
                label="Version"
                value="2.1"
              />

              <AboutItem
                label="Architecture"
                value="React / Vite"
              />

              <AboutItem
                label="Finance"
                value="SQLite-backed local APIs"
              />

              <AboutItem
                label="Quote API"
                value="Port 4182"
              />

              <AboutItem
                label="Invoice API"
                value="Port 4181"
              />
            </div>

            <InfoBox>
              Settings is the central
              configuration area for how
              Chrysalis operates.
            </InfoBox>
          </SettingsSection>
        );

      default:
        return null;
    }
  }

  return (
    <div style={pageStyle}>
      <div
        style={{
          ...headerStyle,
          ...stickyActionBarStyle,
        }}
      >
        <div style={headerContentStyle}>
          <div style={eyebrowStyle}>
            Chrysalis Studio
          </div>

          <h1 style={titleStyle}>
            Settings
          </h1>

          <p style={subtitleStyle}>
            Configure how your studio operates.
          </p>

          {(loading || savedMessage || errorMessage) && (
            <div style={headerMessageStyle}>
              {loading && (
                <span style={loadingMessageStyle}>
                  Loading settings...
                </span>
              )}
              {hasUnsavedChanges && !loading && !savedMessage && (
                <span style={unsavedMessageStyle}>
                  Unsaved changes
                </span>
              )}

              {savedMessage && (
                <span style={savedMessageStyle}>
                  {savedMessage}
                </span>
              )}
              {errorMessage && (
                <span style={errorMessageStyle}>
                  {errorMessage}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={closeSettings}
            disabled={loading}
            style={{
              ...cancelButton,
              opacity: loading ? 0.6 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            Close
          </button>

          <button
            type="button"
            onClick={saveSettings}
            disabled={loading}
            style={{
              ...saveButton,
              ...(hasUnsavedChanges
                ? {
                    boxShadow: "0 3px 10px rgba(139,30,63,.22)",
                    transform: "translateY(-1px)",
                  }
                : {}),
              opacity: loading ? 0.6 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            Save Settings
          </button>
        </div>
      </div>

      <div style={layoutStyle}>
        <nav
          style={navStyle}
          aria-label="Settings sections"
        >
          {SECTIONS.map(
            ([id, label, description]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setActiveSection(id)
                }
                style={{
                  ...navButton,
                  ...(activeSection === id
                    ? navButtonActive
                    : {}),
                }}
              >
                <span style={navLabelStyle}>
                  {label}
                </span>

                <span
                  style={navDescriptionStyle}
                >
                  {description}
                </span>
              </button>
            )
          )}
        </nav>

        <main style={contentStyle}>
          {renderSection()}
        </main>
      </div>

      {backupPanelOpen && (
        <div style={backupOverlayStyle}>
          <button
            type="button"
            aria-label="Close saved versions"
            onClick={() => {
              setBackupPanelOpen(false);
              cancelBackupRename();
            }}
            style={backupOverlayButtonStyle}
          />

          <aside
            style={backupPanelStyle}
            aria-label="Saved versions"
          >
            <div style={backupPanelHeaderStyle}>
              <div>
                <div style={backupPanelEyebrowStyle}>
                  WORKSPACE BACKUPS
                </div>
                <h2 style={backupPanelTitleStyle}>
                  Saved Versions
                </h2>
                <p style={backupPanelDescriptionStyle}>
                  Restore, rename or delete a saved workspace version.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBackupPanelOpen(false);
                  cancelBackupRename();
                }}
                style={backupPanelCloseButtonStyle}
                aria-label="Close saved versions"
              >
                ×
              </button>
            </div>

            <div style={backupPanelToolbarStyle}>
              <input
                type="search"
                value={backupSearch}
                onChange={(event) =>
                  setBackupSearch(event.target.value)
                }
                placeholder="Search backups..."
                aria-label="Search saved versions"
                style={backupSearchInputStyle}
              />

              <button
                type="button"
                onClick={() => loadBackupHistory()}
                disabled={
                  backupHistoryLoading ||
                  backupLoading ||
                  startFreshLoading ||
                  !!restoreLoading ||
                  !!backupMutationLoading
                }
                style={backupRefreshButtonStyle}
              >
                {backupHistoryLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>

            <div style={backupPanelBodyStyle}>
              {backupHistory.length === 0 ? (
                <div style={backupPanelEmptyStyle}>
                  No saved versions yet.
                  <div style={backupPanelEmptyHintStyle}>
                    Create a backup to see it here.
                  </div>
                </div>
              ) : (
                (() => {
                  const query = backupSearch
                    .trim()
                    .toLowerCase();

                  const filteredBackups =
                    backupHistory.filter((backup) => {
                      if (!query) return true;

                      return [
                        backup.name,
                        backup.label,
                        backup.version,
                        formatBackupDate(backup.createdAt),
                      ]
                        .filter(Boolean)
                        .some((value) =>
                          String(value)
                            .toLowerCase()
                            .includes(query)
                        );
                    });

                  if (filteredBackups.length === 0) {
                    return (
                      <div style={backupPanelEmptyStyle}>
                        No saved versions match your search.
                      </div>
                    );
                  }

                  return (
                    <div style={backupPanelListStyle}>
                      {filteredBackups.map((backup) => (
                        <div
                          key={backup.id}
                          style={backupPanelItemStyle}
                        >
                          <div style={backupPanelItemInfoStyle}>
                            {editingBackupId === backup.id ? (
                              <input
                                type="text"
                                value={editingBackupName}
                                onChange={(event) =>
                                  setEditingBackupName(
                                    event.target.value
                                  )
                                }
                                maxLength={80}
                                autoFocus
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    saveBackupName(backup);
                                  }

                                  if (event.key === "Escape") {
                                    cancelBackupRename();
                                  }
                                }}
                                style={backupRenameInputStyle}
                                aria-label="Backup name"
                              />
                            ) : (
                              <div style={backupPanelItemLabelStyle}>
                                {backup.name ||
                                  backup.version ||
                                  backup.label}
                              </div>
                            )}

                            <div style={backupPanelItemMetaStyle}>
                              {backup.version || backup.label}
                              {` · ${formatBackupDate(
                                backup.createdAt
                              )}`}
                              {backup.size
                                ? ` · ${formatBytes(backup.size)}`
                                : ""}
                            </div>
                          </div>

                          <div style={backupPanelItemActionsStyle}>
                            {editingBackupId === backup.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    saveBackupName(backup)
                                  }
                                  disabled={
                                    backupMutationLoading ===
                                    backup.id
                                  }
                                  style={backupPanelActionButtonStyle}
                                >
                                  {backupMutationLoading ===
                                  backup.id
                                    ? "Saving..."
                                    : "Save"}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelBackupRename}
                                  disabled={
                                    backupMutationLoading ===
                                    backup.id
                                  }
                                  style={backupPanelActionButtonStyle}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    beginBackupRename(backup)
                                  }
                                  disabled={
                                    backupLoading ||
                                    startFreshLoading ||
                                    !!restoreLoading ||
                                    !!backupMutationLoading
                                  }
                                  style={backupPanelActionButtonStyle}
                                >
                                  Rename
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteBackup(backup)
                                  }
                                  disabled={
                                    backupLoading ||
                                    startFreshLoading ||
                                    !!restoreLoading ||
                                    !!backupMutationLoading
                                  }
                                  style={{
                                    ...backupPanelActionButtonStyle,
                                    ...backupDeleteButton,
                                  }}
                                >
                                  Delete
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    restoreBackup(backup)
                                  }
                                  disabled={
                                    backupLoading ||
                                    startFreshLoading ||
                                    !!restoreLoading ||
                                    !!backupMutationLoading
                                  }
                                  style={backupPanelRestoreButtonStyle}
                                >
                                  {restoreLoading === backup.id
                                    ? "Restoring..."
                                    : "Restore"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            <div style={backupPanelFooterStyle}>
              <span>
                {backupHistory.length}{" "}
                {backupHistory.length === 1
                  ? "saved version"
                  : "saved versions"}
              </span>

              <button
                type="button"
                onClick={backupDatabase}
                disabled={
                  backupLoading ||
                  startFreshLoading ||
                  !!restoreLoading ||
                  !!backupMutationLoading
                }
                style={backupPanelCreateButtonStyle}
              >
                {backupLoading
                  ? "Creating..."
                  : "Create Backup"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <ThriveDialog {...dialogProps} />
    </div>
  );
}

function GettingStartedCard({
  open,
  onToggle,
  onNavigate,
}) {
  const steps = [
    [
      "business",
      "Business details",
      "Your business name, contact details and identity.",
    ],
    [
      "branding",
      "Branding",
      "Your logo, colours and visual identity.",
    ],
    [
      "jobs",
      "Workflow",
      "How work moves through your business.",
    ],
    [
      "calendar",
      "Calendar",
      "Working days, hours and appointment defaults.",
    ],
    [
      "financial",
      "Financials",
      "GST, deposits, payment terms and currency.",
    ],
  ];

  return (
    <section style={gettingStartedCardStyle}>
      <button
        type="button"
        onClick={onToggle}
        style={gettingStartedHeaderButtonStyle}
        aria-expanded={open}
      >
        <div style={gettingStartedHeaderContentStyle}>
          <div style={gettingStartedEyebrowStyle}>
            GETTING STARTED
          </div>

          <div style={gettingStartedTitleStyle}>
            Let's get your business working your way.
          </div>

          <div style={gettingStartedDescriptionStyle}>
            Not sure what to configure first? Start here.
            We'll guide you through the settings that help
            Chrysalis work the way your business does.
          </div>
        </div>

        <div style={gettingStartedToggleStyle}>
          {open ? "Close guide" : "View setup guide"}
          <span style={gettingStartedArrowStyle}>
            {open ? "-" : ">"}
          </span>
        </div>
      </button>

      {open && (
        <div style={gettingStartedBodyStyle}>
          <div style={gettingStartedStepsStyle}>
            {steps.map(([section, title, description], index) => (
              <button
                key={section}
                type="button"
                onClick={() => onNavigate(section)}
                style={gettingStartedStepStyle}
              >
                <span style={gettingStartedStepNumberStyle}>
                  {index + 1}
                </span>

                <span style={gettingStartedStepTextStyle}>
                  <strong style={gettingStartedStepTitleStyle}>
                    {title}
                  </strong>
                  <span style={gettingStartedStepDescriptionStyle}>
                    {description}
                  </span>
                </span>

                <span style={gettingStartedStepArrowStyle}>
                  &gt;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SettingsSection({
  title,
  description,
  children,
}) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <h2 style={sectionTitleStyle}>
          {title}
        </h2>

        <p style={sectionDescriptionStyle}>
          {description}
        </p>
      </div>

      <div style={formGridStyle}>
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>
        {label}
      </span>

      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  ...props
}) {
  return (
    <input
      {...props}
      type={type}
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={inputStyle}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 4,
  ...props
}) {
  return (
    <textarea
      {...props}
      value={value ?? ""}
      rows={rows}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={{
        ...inputStyle,
        resize: "vertical",
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={inputStyle}
    >
      {options.map(
        ([optionValue, label]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {label}
          </option>
        )
      )}
    </select>
  );
}

function ColourField({
  label,
  description,
  value,
  onChange,
}) {
  return (
    <div style={colourFieldStyle}>
      <div style={colourInfoStyle}>
        <div style={colourLabelStyle}>
          {label}
        </div>

        <div style={colourDescriptionStyle}>
          {description}
        </div>
      </div>

      <div style={colourControlStyle}>
        <input
          type="color"
          value={
            isValidHexColour(value)
              ? value
              : "#000000"
          }
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={colourPickerStyle}
          aria-label={`${label} colour picker`}
        />

        <input
          type="text"
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={colourHexInputStyle}
          maxLength={7}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function BrandPreview({
  settings,
}) {
  const primary =
    isValidHexColour(
      settings.business.primaryColour
    )
      ? settings.business.primaryColour
      : "#8B1E3F";

  const secondary =
    isValidHexColour(
      settings.business.secondaryColour
    )
      ? settings.business.secondaryColour
      : "#2F3A3F";

  const accent =
    isValidHexColour(
      settings.business.accentColour
    )
      ? settings.business.accentColour
      : "#C96A83";

  return (
    <div style={brandPreviewCardStyle}>
      <div style={brandPreviewHeaderStyle}>
        <div>
          <div style={brandPreviewEyebrowStyle}>
            Live Preview
          </div>

          <div style={brandPreviewTitleStyle}>
            {settings.business.businessName || "Your Business Name"}
          </div>

          {settings.business.slogan?.trim() && (
            <div style={brandPreviewSloganStyle}>
              {settings.business.slogan}
            </div>
          )}
        </div>

        {settings.business.logo && (
          <img
            src={settings.business.logo}
            alt="Studio logo"
            style={brandPreviewLogoStyle}
          />
        )}
      </div>

      <div
        style={{
          ...brandPreviewBodyStyle,
          borderTopColor: accent,
        }}
      >
        <div>
          <div
            style={{
              ...previewHeadingStyle,
              color: secondary,
            }}
          >
            Studio Branding
          </div>

          <div style={previewTextStyle}>
            This preview shows how your
            selected colours work together.
          </div>
        </div>

        <div style={previewActionsStyle}>
          <button
            type="button"
            style={{
              ...previewPrimaryButtonStyle,
              background: primary,
            }}
          >
            Primary Action
          </button>

          <button
            type="button"
            style={{
              ...previewSecondaryButtonStyle,
              borderColor: accent,
              color: primary,
            }}
          >
            Secondary
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div style={infoBoxStyle}>
      {children}
    </div>
  );
}

function ActionRow({
  title,
  description,
  buttonLabel,
  onClick,
  danger,
  disabled = false,
  variant = "default",
  buttonStyle = "vibrant",
}) {
  return (
    <div style={actionRowStyle}>
      <div style={actionRowInfoStyle}>
        <div style={actionTitleStyle}>
          {title}
        </div>

        <div style={actionDescriptionStyle}>
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          ...(buttonStyle === "vibrant"
            ? getVibrantActionButton(variant, danger)
            : buttonStyle === "soft"
              ? getSoftActionButton(variant, danger)
              : danger
                ? dangerButton
                : secondaryButton),
          ...compactButton,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled
            ? "not-allowed"
            : "pointer",
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function AboutItem({ label, value }) {
  return (
    <div style={aboutItemStyle}>
      <div style={aboutLabelStyle}>
        {label}
      </div>

      <div style={aboutValueStyle}>
        {value}
      </div>
    </div>
  );
}

function formatBackupDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function formatBytes(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidHexColour(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(
    String(value || "")
  );
}

const gettingStartedCardStyle = {
  marginBottom: 24,
  background: "#FFF8FA",
  border: "1px solid #E8B9C5",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(139,30,63,.04)",
};

const gettingStartedHeaderButtonStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "22px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  textAlign: "left",
  cursor: "pointer",
};

const gettingStartedHeaderContentStyle = {
  minWidth: 0,
};

const gettingStartedEyebrowStyle = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.2,
  color: "#8B1E3F",
  marginBottom: 5,
};

const gettingStartedTitleStyle = {
  fontSize: 22,
  lineHeight: 1.2,
  fontWeight: 800,
  color: "#2F3A3F",
};

const gettingStartedDescriptionStyle = {
  marginTop: 7,
  maxWidth: 760,
  fontSize: 14,
  lineHeight: 1.5,
  color: "#697176",
};

const gettingStartedToggleStyle = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "10px 14px",
  border: "1px solid #D89AAA",
  borderRadius: 999,
  color: "#8B1E3F",
  background: "#FFFFFF",
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const gettingStartedArrowStyle = {
  fontSize: 17,
  lineHeight: 1,
};

const gettingStartedBodyStyle = {
  borderTop: "1px solid #E8B9C5",
  padding: "18px 24px 22px",
  background: "#FFFFFF",
};

const gettingStartedStepsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 10,
};

const gettingStartedStepStyle = {
  minWidth: 0,
  minHeight: 126,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  padding: 14,
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  background: "#FFFFFF",
  color: "#2F3A3F",
  textAlign: "left",
  cursor: "pointer",
};

const gettingStartedStepNumberStyle = {
  width: 27,
  height: 27,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "#F8E7EC",
  color: "#8B1E3F",
  fontSize: 12,
  fontWeight: 800,
};

const gettingStartedStepTextStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const gettingStartedStepTitleStyle = {
  fontSize: 14,
  lineHeight: 1.25,
};

const gettingStartedStepDescriptionStyle = {
  fontSize: 12,
  lineHeight: 1.4,
  color: "#697176",
};

const gettingStartedStepArrowStyle = {
  marginTop: "auto",
  color: "#8B1E3F",
  fontWeight: 800,
  fontSize: 15,
};

const pageStyle = {
  padding: "18px 22px 24px",
  maxWidth: 1400,
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 14,
};

const headerContentStyle = {
  minWidth: 0,
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
  alignSelf: "center",
};

const headerMessageStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 5,
};

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#8B1E3F",
};

const titleStyle = {
  margin: "3px 0 4px",
  color: "#2F3A3F",
  fontSize: 32,
};

const subtitleStyle = {
  margin: 0,
  color: "#777",
  fontSize: 14,
};

const stickyActionBarStyle = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16,
  padding: "9px 12px",
  background: "rgba(255,255,255,.96)",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,.06)",
  backdropFilter: "blur(8px)",
};

const stickyActionBarIdleStyle = {
  padding: "8px 12px",
  marginBottom: 16,
  borderColor: "transparent",
  boxShadow: "none",
  background: "transparent",
};

const stickyActionStatusStyle = {
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const stickyActionButtonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const cancelButton = {
  width: 126,
  minWidth: 126,
  height: 36,
  boxSizing: "border-box",
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  padding: "0 12px",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const unsavedMessageStyle = {
  color: "#8B1E3F",
  fontSize: 13,
  fontWeight: 800,
};

const savedMessageStyle = {
  color: "#166534",
  fontSize: 13,
  fontWeight: 700,
};

const loadingMessageStyle = {
  color: "#697176",
  fontSize: 13,
  fontWeight: 600,
};

const errorMessageStyle = {
  color: "#B42318",
  fontSize: 13,
  fontWeight: 700,
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "220px minmax(0, 1fr)",
  gap: 18,
  alignItems: "start",
};

const navStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 4,
  boxShadow: "0 2px 8px rgba(0,0,0,.025)",
};

const navButton = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  padding: "7px 10px",
  marginBottom: 2,
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: "#3F474B",
  textAlign: "left",
  cursor: "pointer",
};

const navButtonActive = {
  background: "#F9E9EE",
  color: "#8B1E3F",
};

const navLabelStyle = {
  fontSize: 13,
  fontWeight: 800,
};

const navDescriptionStyle = {
  fontSize: 10,
  lineHeight: 1.3,
  color: "#858B8F",
};

const contentStyle = {
  minWidth: 0,
};

const sectionStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 14,
  boxShadow: "0 2px 8px rgba(0,0,0,.025)",
};

const sectionHeaderStyle = {
  paddingBottom: 9,
  marginBottom: 10,
  borderBottom: "1px solid #ECEEEF",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#2F3A3F",
  fontSize: 21,
};

const sectionDescriptionStyle = {
  margin: "4px 0 0",
  color: "#777",
  fontSize: 12,
  lineHeight: 1.4,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#626A6E",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  background: "#FFFFFF",
  color: "#2F3A3F",
  outline: "none",
};

const saveButton = {
  width: 126,
  minWidth: 126,
  height: 36,
  boxSizing: "border-box",
  border: "none",
  borderRadius: 8,
  padding: "0 12px",
  background: "#8B1E3F",
  color: "#FFFFFF",
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const vibrantActionColours = {
  demo: ["#2563EB", "#FFFFFF"],
  backup: ["#16A34A", "#FFFFFF"],
  saved: ["#7C3AED", "#FFFFFF"],
  export: ["#0891B2", "#FFFFFF"],
  reset: ["#EA580C", "#FFFFFF"],
  danger: ["#DC2626", "#FFFFFF"],
  default: ["#8B1E3F", "#FFFFFF"],
};

const softActionColours = {
  demo: ["#E8F0FF", "#1D4ED8"],
  backup: ["#EAF8EF", "#15803D"],
  saved: ["#F1EAFE", "#6D28D9"],
  export: ["#E7F8FB", "#0E7490"],
  reset: ["#FFF1E8", "#C2410C"],
  danger: ["#FFF1F2", "#BE123C"],
  default: ["#F3F4F6", "#374151"],
};

function getVibrantActionButton(variant = "default", danger = false) {
  const [background, color] =
    vibrantActionColours[variant] ||
    vibrantActionColours[danger ? "danger" : "default"];

  return {
    border: "none",
    borderRadius: 9,
    background,
    color,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(47,58,63,.12)",
  };
}

function getSoftActionButton(variant = "default", danger = false) {
  const [background, color] =
    softActionColours[variant] ||
    softActionColours[danger ? "danger" : "default"];

  return {
    border: "1px solid rgba(47,58,63,.08)",
    borderRadius: 9,
    background,
    color,
    fontWeight: 800,
    cursor: "pointer",
  };
}

const secondaryButton = {
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  padding: "9px 13px",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButton = {
  border: "1px solid #F0B4B4",
  borderRadius: 8,
  padding: "9px 13px",
  background: "#FFF5F5",
  color: "#B42318",
  fontWeight: 700,
  cursor: "pointer",
};

const brandingLogoCardStyle = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, .7fr) minmax(300px, 1.3fr)",
  gap: 24,
  alignItems: "center",
  padding: 20,
  border: "1px solid #E5E7EB",
  borderRadius: 13,
  background: "#FAFAFA",
};

const brandingTitleStyle = {
  color: "#2F3A3F",
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 6,
};

const brandingDescriptionStyle = {
  color: "#737B80",
  fontSize: 13,
  lineHeight: 1.55,
};

const logoPreviewAreaStyle = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
};

const logoPreviewWrapperStyle = {
  width: 190,
  height: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 10,
  boxSizing: "border-box",
  border: "1px solid #D9DEE2",
  borderRadius: 10,
  background: "#FFFFFF",
};

const logoPreviewStyle = {
  display: "block",
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
};

const emptyLogoStyle = {
  width: 190,
  height: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px dashed #C8CED2",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#8A9195",
  fontSize: 12,
};

const logoActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const colourFieldStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  padding: 16,
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  background: "#FAFAFA",
};

const colourInfoStyle = {
  minWidth: 0,
};

const colourLabelStyle = {
  color: "#2F3A3F",
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 5,
};

const colourDescriptionStyle = {
  color: "#777",
  fontSize: 12,
  lineHeight: 1.45,
};

const colourControlStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const colourPickerStyle = {
  width: 42,
  height: 38,
  padding: 2,
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  background: "#FFFFFF",
  cursor: "pointer",
};

const colourHexInputStyle = {
  width: 92,
  boxSizing: "border-box",
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  padding: "9px 10px",
  fontSize: 13,
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#2F3A3F",
  background: "#FFFFFF",
};

const brandPreviewCardStyle = {
  gridColumn: "1 / -1",
  overflow: "hidden",
  border: "1px solid #D9DEE2",
  borderRadius: 13,
  background: "#FFFFFF",
};

const brandPreviewHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  minHeight: 78,
  padding: "0 20px",
  background: "#F8F9FA",
};

const brandPreviewEyebrowStyle = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#8A9195",
  marginBottom: 4,
};

const brandPreviewTitleStyle = {
  color: "#2F3A3F",
  fontSize: 18,
  fontWeight: 800,
};

const brandPreviewLogoStyle = {
  maxWidth: 130,
  maxHeight: 55,
  objectFit: "contain",
};

const brandPreviewBodyStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  padding: 20,
  borderTop: "4px solid #C96A83",
};

const previewHeadingStyle = {
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 5,
};

const brandPreviewSloganStyle = {
  marginTop: 6,
  fontSize: 14,
  lineHeight: 1.45,
  color: "#6B7280",
  maxWidth: 560,
};

const previewTextStyle = {
  color: "#737B80",
  fontSize: 12,
};

const previewActionsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const previewPrimaryButtonStyle = {
  border: "none",
  borderRadius: 8,
  padding: "9px 13px",
  color: "#FFFFFF",
  fontWeight: 700,
};

const previewSecondaryButtonStyle = {
  border: "1px solid",
  borderRadius: 8,
  padding: "8px 13px",
  background: "#FFFFFF",
  fontWeight: 700,
};

const infoBoxStyle = {
  gridColumn: "1 / -1",
  padding: "13px 15px",
  borderRadius: 10,
  background: "#F8F9FA",
  border: "1px solid #E5E7EB",
  color: "#697176",
  fontSize: 13,
  lineHeight: 1.55,
};

const actionRowStyle = {
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "9px 0",
  borderBottom: "1px solid #E5E7EB",
};

const actionRowInfoStyle = {
  minWidth: 0,
};

const actionTitleStyle = {
  fontWeight: 800,
  color: "#2F3A3F",
  marginBottom: 2,
};

const actionDescriptionStyle = {
  color: "#777",
  fontSize: 11,
  lineHeight: 1.35,
};

const compactButton = {
  width: 126,
  minWidth: 126,
  height: 36,
  boxSizing: "border-box",
  padding: "0 12px",
  borderRadius: 8,
  fontSize: 12,
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const smallActionButton = {
  ...compactButton,
  border: "1px solid #D9DEE2",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontWeight: 700,
  cursor: "pointer",
};

const backupHistoryStyle = {
  gridColumn: "1 / -1",
  padding: "10px 0 2px",
};

const backupHistoryHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 5,
};

const backupHistoryTitleStyle = {
  fontWeight: 800,
  color: "#2F3A3F",
};

const backupHistoryDescriptionStyle = {
  marginTop: 2,
  color: "#777",
  fontSize: 12,
};

const backupListStyle = {
  borderTop: "1px solid #E5E7EB",
};

const backupItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "7px 0",
  borderBottom: "1px solid #E5E7EB",
};

const backupItemInfoStyle = {
  minWidth: 0,
};

const backupItemLabelStyle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#2F3A3F",
};

const backupItemMetaStyle = {
  marginTop: 2,
  fontSize: 11,
  color: "#858B8F",
};

const backupActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
};

const backupActionButton = {
  width: 84,
  minWidth: 84,
  height: 32,
  boxSizing: "border-box",
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  padding: "0 8px",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const backupDeleteButton = {
  borderColor: "#F0B4B4",
  background: "#FFF5F5",
  color: "#B42318",
};

const backupRenameStyle = {
  display: "flex",
  alignItems: "center",
};

const backupRenameInputStyle = {
  width: "min(420px, 100%)",
  height: 32,
  boxSizing: "border-box",
  border: "1px solid #BFC7CC",
  borderRadius: 7,
  padding: "0 9px",
  fontSize: 13,
  color: "#2F3A3F",
  outline: "none",
};

const backupEmptyStyle = {
  padding: "10px 0",
  color: "#858B8F",
  fontSize: 12,
};

const backupOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(20, 25, 28, .28)",
  display: "flex",
  justifyContent: "flex-end",
};

const backupOverlayButtonStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
  cursor: "default",
};

const backupPanelStyle = {
  position: "relative",
  zIndex: 1,
  width: "min(680px, 92vw)",
  height: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  background: "#FFFFFF",
  borderLeft: "1px solid #E5E7EB",
  boxShadow: "-12px 0 30px rgba(0,0,0,.12)",
};

const backupPanelHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 18,
  padding: "22px 24px 18px",
  borderBottom: "1px solid #E5E7EB",
};

const backupPanelEyebrowStyle = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.1,
  color: "#8B1E3F",
  marginBottom: 5,
};

const backupPanelTitleStyle = {
  margin: 0,
  color: "#2F3A3F",
  fontSize: 24,
};

const backupPanelDescriptionStyle = {
  margin: "5px 0 0",
  color: "#777",
  fontSize: 12,
  lineHeight: 1.45,
};

const backupPanelCloseButtonStyle = {
  width: 34,
  height: 34,
  flexShrink: 0,
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const backupPanelToolbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderBottom: "1px solid #E5E7EB",
  background: "#FAFAFA",
};

const backupSearchInputStyle = {
  flex: 1,
  minWidth: 0,
  height: 36,
  boxSizing: "border-box",
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  padding: "0 11px",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontSize: 13,
  outline: "none",
};

const backupRefreshButtonStyle = {
  ...compactButton,
  width: 100,
  minWidth: 100,
  height: 36,
  border: "1px solid #D9DEE2",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontWeight: 700,
  cursor: "pointer",
};

const backupPanelBodyStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "0 24px",
};

const backupPanelListStyle = {
  borderTop: "1px solid #E5E7EB",
};

const backupPanelItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 0",
  borderBottom: "1px solid #E5E7EB",
};

const backupPanelItemInfoStyle = {
  minWidth: 0,
  flex: 1,
};

const backupPanelItemLabelStyle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#2F3A3F",
  overflowWrap: "anywhere",
};

const backupPanelItemMetaStyle = {
  marginTop: 4,
  fontSize: 11,
  color: "#858B8F",
  lineHeight: 1.4,
};

const backupPanelItemActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const backupPanelActionButtonStyle = {
  width: 78,
  minWidth: 78,
  height: 32,
  boxSizing: "border-box",
  border: "1px solid #D9DEE2",
  borderRadius: 8,
  padding: "0 8px",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const backupPanelRestoreButtonStyle = {
  ...backupPanelActionButtonStyle,
  width: 82,
  minWidth: 82,
  borderColor: "#CFA0AE",
  color: "#8B1E3F",
  background: "#FFF8FA",
};

const backupPanelEmptyStyle = {
  padding: "40px 8px",
  textAlign: "center",
  color: "#697176",
  fontSize: 13,
};

const backupPanelEmptyHintStyle = {
  marginTop: 5,
  color: "#858B8F",
  fontSize: 11,
};

const backupPanelFooterStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 24px",
  borderTop: "1px solid #E5E7EB",
  background: "#FAFAFA",
  color: "#777",
  fontSize: 11,
};

const backupPanelCreateButtonStyle = {
  ...compactButton,
  width: 126,
  minWidth: 126,
  border: "none",
  background: "#8B1E3F",
  color: "#FFFFFF",
  fontWeight: 800,
  cursor: "pointer",
};

const aboutGrid = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const aboutItemStyle = {
  padding: 15,
  border: "1px solid #E5E7EB",
  borderRadius: 11,
  background: "#FAFAFA",
};

const aboutLabelStyle = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  color: "#888",
  marginBottom: 5,
};

const aboutValueStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#2F3A3F",
};


