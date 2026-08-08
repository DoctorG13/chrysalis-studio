import Button from "../common/Button";

export default function JobPhotos({
  job,
  onAddPhoto,
  onOpenPhoto,
}) {
  const photos = Array.isArray(job?.photos)
    ? job.photos
    : [];

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 24,
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#8B1E3F",
              marginBottom: 5,
            }}
          >
            Photos
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#777",
            }}
          >
            Garment photos and visual references
            for this job.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              background:
                photos.length > 0
                  ? "#EDE9FE"
                  : "#F3F4F6",
              color:
                photos.length > 0
                  ? "#6D28D9"
                  : "#666",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {photos.length}{" "}
            {photos.length === 1
              ? "photo"
              : "photos"}
          </div>

          {onAddPhoto && (
            <Button onClick={onAddPhoto}>
              + Add Photos
            </Button>
          )}
        </div>
      </div>

      {/* Photo gallery */}
      {photos.length === 0 ? (
        <EmptyState
          onAddPhoto={onAddPhoto}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(220px,1fr))",
            gap: 18,
          }}
        >
          {photos.map(
            (photo, index) => (
              <PhotoCard
                key={
                  photo.id ||
                  `photo-${index}`
                }
                photo={photo}
                onOpen={() =>
                  onOpenPhoto?.(photo)
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  onOpen,
}) {
  const caption =
    photo?.caption ||
    "Untitled photo";

  const date =
    photo?.date || "";

  return (
    <div
      onClick={onOpen}
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        overflow: "hidden",
        cursor: onOpen
          ? "pointer"
          : "default",
        transition:
          "transform .18s ease, box-shadow .18s ease",
      }}
      onMouseEnter={(event) => {
        if (!onOpen) return;

        event.currentTarget.style.transform =
          "translateY(-2px)";

        event.currentTarget.style.boxShadow =
          "0 8px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          "translateY(0)";

        event.currentTarget.style.boxShadow =
          "none";
      }}
    >
      <div
        style={{
          width: "100%",
          height: 220,
          background: "#F3F4F6",
          overflow: "hidden",
        }}
      >
        {photo?.url ? (
          <img
            src={photo.url}
            alt={caption}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: 32,
            }}
          >
            📷
          </div>
        )}
      </div>

      <div
        style={{
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#2F3A3F",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {caption}
        </div>

        {date && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#777",
            }}
          >
            📅 {formatDate(date)}
          </div>
        )}

        {onOpen && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 600,
              color: "#8B1E3F",
            }}
          >
            View photo →
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onAddPhoto,
}) {
  return (
    <div
      style={{
        padding: 30,
        borderRadius: 14,
        background: "#F8F9FA",
        border:
          "1px solid #E8EAED",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 14px",
          borderRadius: 16,
          background: "#F1F3F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
        }}
      >
        📷
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#555",
          marginBottom: 6,
        }}
      >
        No photos yet
      </div>

      <div
        style={{
          maxWidth: 420,
          margin: "0 auto 18px",
          fontSize: 13,
          lineHeight: 1.5,
          color: "#888",
        }}
      >
        Add photos of the garment,
        fittings, alterations or other
        useful visual references for this
        job.
      </div>

      {onAddPhoto && (
        <Button onClick={onAddPhoto}>
          + Add First Photo
        </Button>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      value
    )
  ) {
    const [
      day,
      month,
      year,
    ] = value.split("/");

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toLocaleDateString(
        "en-AU",
        {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    }
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-AU",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}