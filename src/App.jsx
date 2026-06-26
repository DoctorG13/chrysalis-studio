import { useState } from "react";

import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

export default function App() {
const [currentPage, setCurrentPage] = useState("studio");

  return (
    <AppShell
      sidebar={
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      }
      header={
  <Header
    title="Studio"
    user="Donna"
  />
}
    >
      <div
        style={{
          maxWidth: "900px",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            color: "#2F3A3F",
            fontSize: "42px",
          }}
        >
          🦋 Welcome to Chrysalis
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#666",
            lineHeight: 1.8,
          }}
        >
          Dressmaker Business Operating System
        </p>

        <div
          style={{
            marginTop: "50px",
            padding: "30px",
            borderRadius: "16px",
            background: "white",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Version 2.1</h2>

          <p>
            Welcome to the commercial version of Chrysalis.
          </p>

          <p>
            Our next milestone is building the Studio experience.
          </p>

          <hr />

          <h3>Milestone Progress</h3>

          <ul>
            <li>✅ Fresh React Project</li>
            <li>✅ Git Repository</li>
            <li>✅ Folder Structure</li>
            <li>✅ AppShell</li>
            <li>✅ Sidebar</li>
            <li>⬜ Header</li>
            <li>⬜ Studio Page</li>
            <li>⬜ Navigation</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}