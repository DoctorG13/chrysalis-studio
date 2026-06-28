import Card from "../common/Card";

export default function GarmentCard({
  garment,
}) {
  return (
    <Card>
      <h3
        style={{
          marginTop: 0,
          color: "#2F3A3F",
        }}
      >
        👗 {garment.name}
      </h3>

      <p>Status: {garment.status}</p>

      <p>Type: {garment.type}</p>
    </Card>
  );
}