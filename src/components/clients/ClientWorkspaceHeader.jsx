export default function ClientWorkspaceHeader({
  client,
  onClose,
}) {
  if (!client) return null;

  const activeJobs = client.jobs?.length || 0;

  const outstanding =
    (client.jobs || []).reduce(
      (total, job) =>
        total + (Number(job.balance) || 0),
      0
    );

  const nextAppointment =
    client.appointments?.[0]?.date || "None Scheduled";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          👤 {client.firstName} {client.lastName}
        </h2>

        <button
          type="button"
          onClick={onClose}
          style={{
            border: "1px solid #d9dde2",
            background: "#ffffff",
            color: "#2F3A3F",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ✕ Close Client
        </button>
      </div>

      <div
        style={{
          color: "#666",
          marginBottom: 20,
        }}
      >
        📞 {client.phone || "No Phone"}

        <br />

        ✉️ {client.email || "No Email"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 15,
        }}
      >
        <SummaryCard
          title="Active Jobs"
          value={activeJobs}
          icon="💼"
        />

        <SummaryCard
          title="Next Appointment"
          value={nextAppointment}
          icon="📅"
        />

        <SummaryCard
          title="Outstanding"
          value={`$${outstanding}`}
          icon="💰"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <div
      style={{
        background: "#f7f7f7",
        padding: 15,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "#777",
        }}
      >
        {icon} {title}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  );
}
