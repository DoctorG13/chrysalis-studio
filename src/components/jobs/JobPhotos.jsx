import AssetManagement from "../assets/AssetManagement";

export default function JobPhotos({ job }) {
  if (!job?.id || !job?.clientId) return null;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
      <AssetManagement
        clientId={job.clientId}
        jobId={job.id}
        title="Photos & Assets"
      />
    </div>
  );
}
