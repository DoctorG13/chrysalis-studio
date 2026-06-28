import GarmentCard from "./GarmentCard";

export default function GarmentList({
  garments,
}) {
  if (garments.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 30,
      }}
    >
      <h2>Garments</h2>

      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        {garments.map((garment) => (
          <GarmentCard
            key={garment.id}
            garment={garment}
          />
        ))}
      </div>
    </div>
  );
}