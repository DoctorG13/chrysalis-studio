import Button from "../common/Button";

export default function ClientWorkspace({
  client,
  onClose,
}) {
  if (!client) return null;

  return (
    <>
      <h2
        style={{
          marginTop: 0,
          color: "#2F3A3F",
        }}
      >
        👤 {client.firstName} {client.lastName}
      </h2>

      <p>📞 {client.phone || "No phone number"}</p>

      <p>✉️ {client.email || "No email address"}</p>

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      <h3>Garments</h3>

      <p
        style={{
          color: "#777",
        }}
      >
        No garments have been added yet.
      </p>

      <Button>
        + New Garment
      </Button>

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Button>
          Save Changes
        </Button>

        <Button>
          Delete Client
        </Button>

        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}