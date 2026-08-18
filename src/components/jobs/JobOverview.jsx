const WORKFLOW_STAGES = [
  "New",
  "Measuring",
  "Cutting",
  "Sewing",
  "Fitting",
  "Alterations",
  "Ready",
  "Collected",
];

const CHECKLIST_ITEMS = [
  "Measurements confirmed",
  "Fabric / materials ready",
  "Pattern / cutting complete",
  "Construction complete",
  "Fitting complete",
  "Final alterations complete",
  "Ready for collection",
];

export default function JobOverview({ job }) {
  const quote = Number(job.price || 0);

  const totalPaid = (job.payments || []).reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  const balance = Math.max(quote - totalPaid, 0);

  const paymentPercent =
    quote > 0
      ? Math.min(Math.max((totalPaid / quote) * 100, 0), 100)
      : 0;

  const checklist = job.workflowChecklist || {};
  const completedChecklist = CHECKLIST_ITEMS.filter(
    (item) => Boolean(checklist[item])
  ).length;

  const checklistPercent = Math.round(
    (completedChecklist / CHECKLIST_ITEMS.length) * 100
  );

  const currentStageIndex = WORKFLOW_STAGES.indexOf(job.status);
  const statusStyle = getStatusStyle(job.status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionTitleStyle}>Garment Workflow</div>
            <div style={sectionSubtitleStyle}>
              Move the job through production as work is completed.
            </div>
          </div>

          {job.status && (
            <span
              style={{
                ...statusBadgeStyle,
                background: statusStyle.background,
                color: statusStyle.color,
              }}
            >
              {job.status}
            </span>
          )}
        </div>

        <div style={workflowGridStyle}>
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCurrent = job.status === stage;
            const isComplete = currentStageIndex >= 0 && index < currentStageIndex;

            return (
              <div
                key={stage}
                style={{
                  ...workflowItemStyle,
                  ...(isCurrent ? workflowCurrentStyle : {}),
                  ...(isComplete ? workflowCompleteStyle : {}),
                }}
              >
                <span style={workflowNumberStyle}>
                  {isComplete ? "✓" : index + 1}
                </span>
                <span style={workflowLabelStyle}>{stage}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={productionSectionStyle}>
        <div style={productionColumnsStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={sectionTitleStyle}>Production Checklist</div>
            <div style={sectionSubtitleStyle}>
              Complete each production requirement as the job progresses.
            </div>

            <div style={checklistGridStyle}>
              {CHECKLIST_ITEMS.map((item, index) => {
                const completed = Boolean(checklist[item]);

                return (
                  <div
                    key={item}
                    style={{
                      ...checklistItemStyle,
                      ...(completed ? checklistCompleteStyle : {}),
                    }}
                  >
                    <span
                      style={{
                        ...checklistNumberStyle,
                        ...(completed ? checklistNumberCompleteStyle : {}),
                      }}
                    >
                      {completed ? "✓" : index + 1}
                    </span>
                    <span
                      style={{
                        textDecoration: completed ? "line-through" : "none",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={progressRowStyle}>
              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${checklistPercent}%`,
                  }}
                />
              </div>
              <strong style={progressPercentStyle}>
                {completedChecklist} / {CHECKLIST_ITEMS.length}
              </strong>
            </div>
          </div>

          <div style={notesColumnStyle}>
            <div style={sectionTitleStyle}>Workflow Notes</div>
            <div style={sectionSubtitleStyle}>
              Production notes, materials, alterations or special instructions.
            </div>
            <div style={notesBoxStyle}>
              {job.workflowNotes ? (
                job.workflowNotes
              ) : (
                <span style={{ color: "#999" }}>
                  No workflow notes yet.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Job Overview</div>

        <div style={summaryGridStyle}>
          <SummaryItem
            label="Garment"
            value={job.garmentType || "General Job"}
            icon="👗"
          />
          <SummaryItem
            label="Status"
            value={job.status || "-"}
            statusStyle={statusStyle}
          />
          <SummaryItem
            label="Due Date"
            value={formatDate(job.dueDate)}
            icon="📅"
            fullWidth
          />
        </div>

        <div style={dividerStyle} />

        <div style={subsectionTitleStyle}>Financial Summary</div>

        <div style={financialGridStyle}>
          <MoneyItem label="Quote" value={quote} />
          <MoneyItem label="Total Paid" value={totalPaid} />
          <MoneyItem label="Outstanding" value={balance} highlight />
        </div>

        <div style={paymentProgressWrapStyle}>
          <div style={paymentProgressHeaderStyle}>
            <span>Payment progress</span>
            <strong>{Math.round(paymentPercent)}%</strong>
          </div>

          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${paymentPercent}%`,
              }}
            />
          </div>

          <div style={remainingStyle}>
            {balance <= 0 ? "Fully paid" : `$${balance.toFixed(2)} remaining`}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ label, value, icon, statusStyle, fullWidth = false }) {
  return (
    <div
      style={{
        ...summaryItemStyle,
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>
        {icon && <span>{icon}</span>}
        {statusStyle ? (
          <span
            style={{
              ...statusBadgeStyle,
              background: statusStyle.background,
              color: statusStyle.color,
            }}
          >
            {value}
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function MoneyItem({ label, value, highlight = false }) {
  return (
    <div
      style={{
        ...moneyItemStyle,
        ...(highlight ? moneyHighlightStyle : {}),
      }}
    >
      <div style={summaryLabelStyle}>{label}</div>
      <div
        style={{
          ...moneyValueStyle,
          color: highlight ? "#8A5A00" : "#2F3A3F",
        }}
      >
        ${Number(value || 0).toFixed(2)}
      </div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const parts = dateString.split("/");
  if (parts.length !== 3) return dateString;

  const [day, month, year] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status) {
  switch (status) {
    case "Measuring":
      return { background: "#DBEAFE", color: "#1D4ED8" };
    case "Cutting":
      return { background: "#EDE9FE", color: "#6D28D9" };
    case "Sewing":
    case "Construction":
      return { background: "#FFE4E6", color: "#BE123C" };
    case "Mending":
      return { background: "#E0F2FE", color: "#0369A1" };
    case "Fitting":
      return { background: "#FEF3C7", color: "#92400E" };
    case "Alterations":
      return { background: "#FCE7F3", color: "#9D174D" };
    case "Ready":
      return { background: "#DCFCE7", color: "#166534" };
    case "Collected":
      return { background: "#E5E7EB", color: "#374151" };
    case "Cancelled":
      return { background: "#FEE2E2", color: "#991B1B" };
    default:
      return { background: "#F3F4F6", color: "#374151" };
  }
}

const sectionStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,0.025)",
};

const productionSectionStyle = {
  ...sectionStyle,
  background: "#FAF9F6",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
};

const sectionTitleStyle = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#8B1E3F",
};

const sectionSubtitleStyle = {
  marginTop: 5,
  fontSize: 13,
  lineHeight: 1.4,
  color: "#777",
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const workflowGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: 7,
};

const workflowItemStyle = {
  minHeight: 62,
  border: "1px solid #D9DDE1",
  borderRadius: 10,
  background: "#FFFFFF",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  padding: "7px 4px",
  boxSizing: "border-box",
};

const workflowCurrentStyle = {
  border: "2px solid #8B1E3F",
  background: "#FFF5F7",
};

const workflowCompleteStyle = {
  border: "1px solid #B7DFC5",
  background: "#F0FDF4",
};

const workflowNumberStyle = {
  width: 23,
  height: 23,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ECEFF1",
  color: "#69737A",
  fontSize: 11,
  fontWeight: 800,
};

const workflowLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "#4F585E",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const productionColumnsStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.45fr) minmax(280px, 0.8fr)",
  gap: 24,
  alignItems: "start",
};

const checklistGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  marginTop: 15,
};

const checklistItemStyle = {
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "7px 10px",
  border: "1px solid #D9DDE1",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#4F585E",
  fontSize: 12,
  fontWeight: 700,
  boxSizing: "border-box",
};

const checklistCompleteStyle = {
  border: "1px solid #B7DFC5",
  background: "#F0FDF4",
  color: "#34724B",
};

const checklistNumberStyle = {
  width: 24,
  height: 24,
  flexShrink: 0,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ECEFF1",
  color: "#69737A",
  fontSize: 11,
  fontWeight: 800,
};

const checklistNumberCompleteStyle = {
  background: "#D8F3DF",
  color: "#34724B",
};

const notesColumnStyle = {
  borderLeft: "1px solid #E4E0D9",
  paddingLeft: 24,
};

const notesBoxStyle = {
  marginTop: 15,
  minHeight: 125,
  padding: 13,
  border: "1px solid #D9DDE1",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#4F585E",
  fontSize: 13,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const progressRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 14,
};

const progressTrackStyle = {
  flex: 1,
  height: 7,
  background: "#ECEFF1",
  borderRadius: 999,
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  background: "#8B1E3F",
  borderRadius: 999,
  transition: "width 0.25s ease",
};

const progressPercentStyle = {
  minWidth: 36,
  textAlign: "right",
  fontSize: 11,
  color: "#777",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 14,
};

const summaryItemStyle = {
  background: "#F8F9FA",
  border: "1px solid #E8EAED",
  borderRadius: 10,
  padding: 12,
};

const summaryLabelStyle = {
  fontSize: 11,
  color: "#888",
  marginBottom: 5,
};

const summaryValueStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 14,
  fontWeight: 700,
  color: "#2F3A3F",
};

const dividerStyle = {
  borderTop: "1px solid #ECECEC",
  margin: "20px 0",
};

const subsectionTitleStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: "#666",
};

const financialGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
  marginTop: 11,
};

const moneyItemStyle = {
  padding: "11px 10px",
  borderRadius: 10,
  background: "#F8F9FA",
  border: "1px solid #E8EAED",
};

const moneyHighlightStyle = {
  background: "#FFF7E6",
  border: "1px solid #F3D38A",
};

const moneyValueStyle = {
  fontSize: 17,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const paymentProgressWrapStyle = {
  marginTop: 16,
};

const paymentProgressHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 7,
  fontSize: 12,
  color: "#666",
};

const remainingStyle = {
  marginTop: 7,
  fontSize: 11,
  color: "#888",
};
