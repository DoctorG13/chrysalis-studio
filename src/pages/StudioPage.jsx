import { useState } from "react";

import Card from "../components/common/Card";
import Button from "../components/common/Button";
import StatCard from "../components/common/StatCard";
import SlidePanel from "../components/common/SlidePanel";
import TextInput from "../components/common/TextInput";
import ClientForm from "../components/clients/ClientForm";
import ClientList from "../components/clients/ClientList";

export default function StudioPage({
  clients,
  setClients,
}) {
  const [showClientPanel, setShowClientPanel] = useState(false);
  function handleSaveClient(client) {
  setClients([...clients, client]);
  setShowClientPanel(false);
}

  return (
    <>
      <h1
        style={{
          marginTop: 0,
          marginBottom: 8,
          color: "#2F3A3F",
          fontSize: 38,
        }}
      >
        Today's Studio
      </h1>

      <p
        style={{
          color: "#777",
          fontSize: 18,
          marginBottom: 35,
        }}
      >
        Welcome back. Everything is ready for your day.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <StatCard
          icon="👥"
          title="Clients"
          value={clients.length}
          subtitle="Registered clients"
        />

        <StatCard
          icon="👗"
          title="Garments"
          value="0"
          subtitle="Active garments"
        />

        <StatCard
          icon="📅"
          title="Appointments"
          value="0"
          subtitle="Today's schedule"
        />

        <StatCard
          icon="💰"
          title="Revenue"
          value="$0"
          subtitle="This financial year"
        />
      </div>

      <Card title="Today's Focus">
        <p
  style={{
    marginTop: 0,
    color: "#666",
    lineHeight: 1.7,
  }}
>
  {clients.length === 0
    ? "Welcome to Chrysalis. Your first client is only one click away."
    : `You currently have ${clients.length} client${
        clients.length === 1 ? "" : "s"
      } registered in your studio.`}
</p>

{clients.length === 1 && (
  <div
    style={{
      marginTop: 20,
      padding: 20,
      background: "#EAF8EA",
      border: "1px solid #B8E6B8",
      borderRadius: 10,
      color: "#2F3A3F",
      fontWeight: 600,
    }}
  >
    🎉 Congratulations! You've added your first client to Chrysalis.
  </div>
)}


        <ul
          style={{
            color: "#666",
            lineHeight: 2,
          }}
        >
          <li>Today's fittings</li>
          <li>Garments due this week</li>
          <li>Outstanding payments</li>
          <li>Important reminders</li>
        </ul>
      </Card>

      <div
        style={{
          marginTop: 30,
        }}
      >
        <Card title="Quick Actions">
          <div
            style={{
              display: "flex",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <Button onClick={() => setShowClientPanel(true)}>
              + New Client
            </Button>

            <Button>
              + New Garment
            </Button>

            <Button>
              + Appointment
            </Button>
          </div>
        </Card>
      </div>

      <ClientList clients={clients} />

      <SlidePanel open={showClientPanel}>
  <ClientForm
    onSave={handleSaveClient}
    onCancel={() => setShowClientPanel(false)}
  />
</SlidePanel>
    </>
  );
}