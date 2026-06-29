import Card from "../common/Card";

export default function GarmentCard({
  garment,
  onClick,
}) {
  return (
    <div
      onClick={() => onClick?.(garment)}
      style={{
        cursor: "pointer",
      }}
    >
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 10,
                color: "#2F3A3F",
              }}
            >
              👗 {garment.name}
            </h3>

            <p
              style={{
                margin: "6px 0",
                color: "#666",
              }}
            >
              Status: {garment.status}
            </p>

            <p
              style={{
                margin: "6px 0",
                color: "#666",
              }}
            >
              Due: {garment.dueDate || "-"}
            </p>
          </div>

          <div
            style={{
              fontSize: 24,
              color: "#BBB",
            }}
          >
            ›
          </div>
        </div>
      </Card>
    </div>
  );
}