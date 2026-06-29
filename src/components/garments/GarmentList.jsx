import GarmentCard from "./GarmentCard";

export default function GarmentList({
  garments = [],
  onGarmentClick,
}) {
  if (garments.length === 0) {
    return (
      <p
        style={{
          color: "#777",
        }}
      >
        No garments have been added yet.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      {garments.map((garment) => (
        <GarmentCard
          key={garment.id}
          garment={garment}
          onClick={onGarmentClick}
        />
      ))}
    </div>
  );
}