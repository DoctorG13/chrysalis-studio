import Card from "../common/Card";

export default function WelcomeCard({ clients }) {
  return (
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
    </Card>
  );
}