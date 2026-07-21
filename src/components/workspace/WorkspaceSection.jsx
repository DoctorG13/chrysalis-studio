import "./WorkspaceSection.css";

export default function WorkspaceSection({
  title,
  icon = null,
  isOpen,
  onToggle,
  children,
}) {
  return (
    <section className="workspace-section">
      <button
        type="button"
        className="workspace-header"
        onClick={onToggle}
        data-workspace-section={title.toLowerCase()}
      >
        <div className="workspace-title">
          {icon && (
            <span className="workspace-icon">
              {icon}
            </span>
          )}

          <span>{title}</span>
        </div>

        <span
          className={`workspace-chevron ${
            isOpen ? "open" : ""
          }`}
        >
          ▶
        </span>
      </button>

      <div
        className={`workspace-content ${
          isOpen ? "open" : ""
        }`}
      >
        <div className="workspace-content-inner">
          {children}
        </div>
      </div>
    </section>
  );
}