import Button from "../common/Button";

export default function JobPhotos({
  job,
  onAddPhoto,
  onOpenPhoto,
}) {
  const photos = job.photos || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Photos
          </h2>

          <div
            style={{
              color: "#777",
              marginTop: 4,
            }}
          >
            {photos.length} Photos
          </div>
        </div>

        <Button onClick={onAddPhoto}>
          + Add Photos
        </Button>
      </div>

      {photos.length === 0 ? (
        <div
          style={{
            border: "2px dashed #DDD",
            borderRadius: 12,
            padding: 60,
            textAlign: "center",
          }}
        >
          <h3>No Photos Yet</h3>

          <p>
            Drag photos here or click "Add Photos".
          </p>

          <Button onClick={onAddPhoto}>
            Add First Photo
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(220px,1fr))",
            gap: 20,
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                background: "#FFF",
                border: "1px solid #DDD",
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() =>
                onOpenPhoto?.(photo)
              }
            >
              <img
                src={photo.url}
                alt={photo.caption || ""}
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                }}
              />

              <div
                style={{
                  padding: 14,
                }}
              >
                <strong>
                  {photo.caption ||
                    "Untitled"}
                </strong>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#777",
                  }}
                >
                  {photo.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}