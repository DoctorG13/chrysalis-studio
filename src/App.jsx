import { useEffect, useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import StudioPage from "./pages/StudioPage";
import PeoplePage from "./pages/PeoplePage";
import GarmentsPage from "./pages/GarmentsPage";
import CalendarPage from "./pages/CalendarPage";
import FinancePage from "./pages/FinancePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

import ClientWorkspace from "./components/clients/ClientWorkspace";
import SlidePanel from "./components/common/SlidePanel";

import { useChrysalis } from "./context/ChrysalisProvider";
import { searchStudio } from "./utils/search";

const DEFAULT_BRANDING = {
  businessName: "Your Business",
  ownerName: "Your Name",
  logo: "",
  slogan: "",
  primaryColour: "#8B1E3F",
  secondaryColour: "#2F3A3F",
  accentColour: "#C96A83",
};

const DEMO_BRANDING = {
  businessName: "Demo Workspace",
  ownerName: "Demo User",
  logo: "",
  slogan: "Explore THRIVE with sample data.",
  primaryColour: "#8B1E3F",
  secondaryColour: "#2F3A3F",
  accentColour: "#C96A83",
};

function getStoredSettings() {
  try {
    const stored =
      window.localStorage.getItem(
        "chrysalisSettings"
      );

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function getBrandingFromSettings(settings) {
  const business =
    settings?.business || {};

  return {
    businessName:
      business.businessName?.trim() ||
      DEFAULT_BRANDING.businessName,

    ownerName:
      business.ownerName?.trim() ||
      DEFAULT_BRANDING.ownerName,

    logo:
      business.logo ||
      DEFAULT_BRANDING.logo,

    slogan:
      business.slogan?.trim() ||
      DEFAULT_BRANDING.slogan,

    primaryColour:
      business.primaryColour ||
      DEFAULT_BRANDING.primaryColour,

    secondaryColour:
      business.secondaryColour ||
      DEFAULT_BRANDING.secondaryColour,

    accentColour:
      business.accentColour ||
      DEFAULT_BRANDING.accentColour,
  };
}

function getInitialBranding() {
  return {
    ...DEFAULT_BRANDING,
    ...getBrandingFromSettings(
      getStoredSettings()
    ),
  };
}

export default function App() {
  const [currentPage, setCurrentPage] =
    useState("studio");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [branding, setBranding] =
    useState(getInitialBranding);

  const {
    clients,
    jobs,
    appointments,
    setClients,
    createJob,
    updateJob,
    deleteJob,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    showWorkspace,
    selectedClient,
    selectedJobId,
    closeWorkspace,
    isDemoMode,
    toggleDemoMode,
  } = useChrysalis();

  const displayBranding = isDemoMode
    ? DEMO_BRANDING
    : branding;

  const searchResults = useMemo(
    () =>
      searchStudio(
        searchQuery,
        clients,
        jobs
      ),
    [
      searchQuery,
      clients,
      jobs,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBranding() {
      try {
        const response =
          await fetch("/api/settings");

        if (!response.ok) {
          return;
        }

        const payload =
          await response.json();

        if (cancelled) {
          return;
        }

        const nextBranding =
          getBrandingFromSettings(
            payload?.settings
          );

        setBranding(nextBranding);

        try {
          window.localStorage.setItem(
            "chrysalisSettings",
            JSON.stringify(
              payload?.settings || {}
            )
          );
        } catch {
          // Database remains the source of truth.
        }
      } catch {
        // Local branding remains available.
      }
    }

    loadBranding();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSettingsSaved(
    nextSettings
  ) {
    const nextBranding =
      getBrandingFromSettings(
        nextSettings
      );

    setBranding(nextBranding);

    try {
      window.localStorage.setItem(
        "chrysalisSettings",
        JSON.stringify(nextSettings)
      );
    } catch {
      // Database remains the source of truth.
    }
  }

  function renderPage() {
    switch (currentPage) {
      case "people":
        return (
          <PeoplePage
            clients={clients}
            setClients={setClients}
          />
        );

      case "garments":
        return (
          <GarmentsPage
            clients={clients}
            jobs={jobs}
          />
        );

      case "calendar":
        return (
          <CalendarPage
            clients={clients}
            jobs={jobs}
          />
        );

      case "finance":
        return (
          <FinancePage
            clients={clients}
            jobs={jobs}
          />
        );

      case "reports":
        return (
          <ReportsPage />
        );

      case "settings":
        return (
          <SettingsPage
            onSettingsSaved={
              handleSettingsSaved
            }
            isDemoMode={isDemoMode}
            onToggleDemo={toggleDemoMode}
            onStartFresh={async () => {
              await setClients([]);

              const response = await fetch(
                "/api/clients"
              );

              if (!response.ok) {
                throw new Error(
                  "Unable to verify the fresh workspace."
                );
              }

              const payload = await response.json();

              if (
                Array.isArray(payload?.clients) &&
                payload.clients.length > 0
              ) {
                throw new Error(
                  "Some client records could not be removed."
                );
              }
            }}
            onClose={() =>
              setCurrentPage("studio")
            }
          />
        );

      case "studio":
      default:
        return (
          <StudioPage
            clients={clients}
            jobs={jobs}
            setClients={setClients}
            createJob={createJob}
            updateJob={updateJob}
            deleteJob={deleteJob}
            searchQuery={searchQuery}
            searchResults={searchResults}
            onClearSearch={() =>
              setSearchQuery("")
            }
            onOpenCalendar={() =>
              setCurrentPage("calendar")
            }
            ownerName={
              displayBranding.ownerName
            }
          />
        );
    }
  }

  const pageTitle =
    currentPage === "people"
      ? "People"
      : currentPage === "garments"
        ? "Garments"
        : currentPage === "calendar"
          ? "Calendar"
          : currentPage === "finance"
            ? "Finance"
            : currentPage === "reports"
              ? "Reports"
              : currentPage === "settings"
                ? "Settings"
                : displayBranding.businessName;

  return (
    <AppShell
      branding={displayBranding}
      sidebar={
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={
            setCurrentPage
          }
          branding={
            displayBranding
          }
        />
      }
      header={
        <Header
          title={pageTitle}
          user={
            displayBranding.ownerName
          }
          searchQuery={
            searchQuery
          }
          searchResults={
            searchResults
          }
          onSearch={
            setSearchQuery
          }
          branding={
            displayBranding
          }
          isDemoMode={
            isDemoMode
          }
          onToggleDemo={
            toggleDemoMode
          }
        />
      }
    >
      {renderPage()}

      <SlidePanel
        open={showWorkspace}
        onClose={
          closeWorkspace
        }
      >
        <ClientWorkspace
          client={selectedClient}
          clients={clients}
          jobs={jobs}
          setClients={setClients}
          createJob={createJob}
          updateJob={updateJob}
          deleteJob={deleteJob}
          appointments={
            appointments
          }
          createAppointment={
            createAppointment
          }
          updateAppointment={
            updateAppointment
          }
          deleteAppointment={
            deleteAppointment
          }
          initialJobId={
            selectedJobId
          }
          onClose={
            closeWorkspace
          }
        />
      </SlidePanel>
    </AppShell>
  );
}
