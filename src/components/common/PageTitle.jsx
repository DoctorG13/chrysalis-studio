export default function PageTitle({
  title,
  subtitle,
}) {
  return (
    <div
      style={{
        marginBottom: 30,
      }}
    >
      <h1
        style={{
          margin: 0,
          color: "#2F3A3F",
          fontSize: 36,
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          style={{
            marginTop: 10,
            color: "#777",
            fontSize: 18,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}