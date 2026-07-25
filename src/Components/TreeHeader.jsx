import "./TreeHeader.css";

/**
 * Family tree header.
 * Drop-in replacement for the existing <header className="tree-header"> block.
 *
 * Props:
 *  - onExpandAll(), onCollapseAll(): handlers (same as handleExpandAll/handleCollapseAll before)
 *  - memberCount, generationCount: same as before
 *  - logoSrc: defaults to "/Logo.png"
 *  - established: optional small "Est. 1963" style eyebrow — pass the family's founding date/year,
 *                 or omit the prop (pass established={null}) to hide it
 */
export default function TreeHeader({
  onExpandAll,
  onCollapseAll,
  memberCount,
  generationCount,
  logoSrc = "/Logo.png",
  established = "Since. 1963",
}) {
  return (
    <header className="tree-header">
      <div className="tree-header-top">
        <div className="title-cluster">
          {/* Signature element: the family crest sits in a locket frame, not a logo lockup */}
          <div className="locket">
            <img
              src={logoSrc}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling.style.display = "flex";
              }}
            />
            <div className="locket-fallback" style={{ display: "none" }}>
              {/* Falls back to initials if /Logo.png is missing */}
              NM
            </div>
          </div>

          <div className="title-text">
            {established && <span className="eyebrow">{established}</span>}
            <h1 className="tree-title">Family tree</h1>
            <p className="tree-subtitle">
              Tap a name for details · use the arrows to collapse a branch
            </p>
            <svg className="flourish" viewBox="0 0 130 14" aria-hidden="true">
              <path d="M2 8 C 30 2, 55 12, 82 6 S 120 2, 128 7" />
              <circle cx="46" cy="8.5" r="2.1" />
              <circle cx="97" cy="4.5" r="1.7" />
            </svg>
          </div>
        </div>

        <div className="tree-header-actions">
          <button className="tree-action-btn" onClick={onExpandAll}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 13 12 18 17 13" />
              <polyline points="7 6 12 11 17 6" />
            </svg>
            Expand all
          </button>
          <button className="tree-action-btn" onClick={onCollapseAll}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 11 12 6 7 11" />
              <polyline points="17 18 12 13 7 18" />
            </svg>
            Collapse all
          </button>
        </div>
      </div>

      <div className="tree-divider" />

      <div className="tree-header-bottom">
        <div className="legend-item">
          <span className="legend-dot legend-dot--male" />
          Male
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot--female" />
          Female
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot--deceased" />
          Deceased
        </div>
        <div className="legend-divider" />
        <div className="tree-stats">
          <span>{memberCount} members</span>
          <span>{generationCount} generations</span>
        </div>
      </div>
    </header>
  );
}