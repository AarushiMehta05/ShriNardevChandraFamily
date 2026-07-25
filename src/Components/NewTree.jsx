import React, { useState, useCallback } from "react";
import family from "./NewData";
// import "./NewTree.css";
import "./NewTree.css";

// ── Your icon assets ──
// NOTE: these are plain string paths, not imports. Files in /public are
// served as-is at the root URL, so importing them as JS modules
// (e.g. `import BirthdayIcon from "/Birthday.png"`) is non-standard and
// can silently resolve to undefined depending on your bundler (CRA/Vite).
// Referencing them as strings always works, with zero build config.
const BirthdayIcon = "/Birthday.png";
const KidsIcon = "/Kids.png";
const PassedAwayIcon = "/PassedAway.png";
const HeartIcon = "/Heart.png";
const MarryIcon = "/Marry.png";
const Home = "/Home.png";

import Pop from "./Popup";
import TreeHeader from "./TreeHeader";

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
// Total people in the tree, including spouses
function countAllMembers(person) {
  if (!person) return 0;
  let n = 1; // this person
  if (person.spouse) n += 1;
  (person.children || []).forEach((c) => (n += countAllMembers(c)));
  return n;
}

// Depth of the tree (1 = just the root generation)
function countGenerations(person) {
  if (!person || !person.children || person.children.length === 0) return 1;
  return 1 + Math.max(...person.children.map(countGenerations));
}

// Collect every id that has children, so "expand/collapse all" can toggle them
function getAllParentIds(person, ids = []) {
  if (!person) return ids;
  if (person.children?.length > 0) {
    ids.push(person.id);
    person.children.forEach((c) => getAllParentIds(c, ids));
  }
  return ids;
}

function countDescendants(person) {
  let n = person.children?.length || 0;
  (person.children || []).forEach((c) => (n += countDescendants(c)));
  return n;
}

function nodeTopColor(person) {
  if (person.dod) return "#757575";
  return person.gender === "Female" ? "hotpink" : "royalblue";
}

// Anniversary can live on either partner's record — check both
function getAnniversary(person) {
  return person.ann || person.spouse?.ann || null;
}

function findPersonById(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  if (root.spouse?.id === id) return root.spouse;
  for (const child of root.children || []) {
    const found = findPersonById(child, id);
    if (found) return found;
  }
  return null;
}

// Small reusable icon wrapper so sizing/alignment stays consistent
function Icon({ src, alt, size = 20, className = "" }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={`icon-img ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Photos live in /public/people, filed under the person's exact name.
// e.g. person.name === "Eleanor Whitfield" -> /public/people/Eleanor Whitfield.jpg
const PHOTO_DIR = "/People";
const PHOTO_EXT = "jpeg"; // change if your files are .png / .jpeg

function photoSrc(name) {
  return `${PHOTO_DIR}/${encodeURIComponent(name)}.${PHOTO_EXT}`;
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function NoProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="dtc-noprofile-icon"
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.8 4.4-5.8 7.5-5.8s6.1 2 7.5 5.8" />
    </svg>
  );
}

function Portrait({ person, ringColor, isDeceased }) {
  const [broken, setBroken] = useState(false);
  const src = person.photo || photoSrc(person.name);
  const showPhoto = !broken;

  return (
    <div
      className={`dtc-portrait-wrap${
        isDeceased ? " " : ""
      }`}
    >
      <div className="dtc-portrait-ring" style={{ borderColor: ringColor }}>
        {showPhoto ? (
          <img
            src={src}
            alt={person.name}
            className="dtc-portrait-img"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="dtc-portrait-fallback">
            <NoProfileIcon />
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Detail card
// ──────────────────────────────────────────────────────────
function DetailCard({ person }) {
  if (!person) return null;
  const isDeceased = !!person.dod;
  const topColor = nodeTopColor(person);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxBroken, setLightboxBroken] = React.useState(false);

  // Same source logic as Portrait, so the lightbox always shows
  // exactly the same photo the small circle is showing.
  const lightboxSrc = person.photo || photoSrc(person.name);

  return (
    <div className="dtc-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

        .dtc-wrap {
          --paper: #ffffff;
          --card: #F6F1E4;
          --ink: #2A2318;
          --ink-soft: #6E6455;
          --deceased: #8A8578;
          --gold: #A9803C;
          --hairline: rgba(42, 35, 24, 0.12);

          font-family: 'Work Sans', sans-serif;
          background: var(--paper);
          padding: 30px 16px 24px;
          display: flex;
          justify-content: center;
          box-sizing: border-box;
        }

        .detail-card {
          position: relative;
          width: 400px;
          background: var(--card);
          border: 1px solid var(--hairline);
          border-top: 3px solid var(--ink);
          border-radius: 14px;
          padding: 40px 22px 18px;
          box-sizing: border-box;
          text-align: center;
        }

        .dtc-portrait-wrap {
          position: absolute;
          top: -34px;
          left: 50%;
          transform: translateX(-50%);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .dtc-portrait-wrap:hover {
          transform: translateX(-50%) scale(1.05);
        }
        .dtc-portrait-wrap:active {
          transform: translateX(-50%) scale(0.96);
        }

        .dtc-portrait-ring {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 2.5px solid var(--gold);
          background: var(--paper);
          padding: 3px;
          box-sizing: border-box;
          box-shadow: 0 1px 0 rgba(42,35,24,0.06);
        }

        .dtc-portrait-wrap--deceased .dtc-portrait-ring {
          border-color: var(--deceased);
        }
        .dtc-portrait-wrap--deceased .dtc-portrait-img {
          filter: grayscale(1) contrast(0.96);
        }

        .dtc-portrait-img,
        .dtc-portrait-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .dtc-portrait-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(169, 128, 60, 0.14);
          color: var(--gold);
        }

        .dtc-noprofile-icon {
          width: 60%;
          height: 60%;
        }

        .detail-name {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 18px;
          color: var(--ink);
          margin: 0 0 12px;
          letter-spacing: -0.01em;
        }

        .detail-card--deceased .detail-name {
          color: var(--ink-soft);
        }

        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-top: 1px solid var(--hairline);
          text-align: left;
        }
        .detail-row:first-of-type { border-top: 1px solid var(--hairline); }

        .detail-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ink-soft);
          flex-shrink: 0;
        }

        .dtc-icon {
          width: 13px;
          height: 13px;
          opacity: 0.75;
        }

        .detail-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--ink);
          text-align: right;
          overflow-wrap: anywhere;
        }

        /* ---------- Lightbox ---------- */
        .dtc-lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 16, 10, 0.92);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: dtc-fade-in 0.2s ease;
        }
        @keyframes dtc-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dtc-lightbox-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: dtc-scale-in 0.22s cubic-bezier(0.2, 0.8, 0.3, 1);
        }
        @keyframes dtc-scale-in {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .dtc-lightbox-ring {
          width: min(80vw, 380px);
          height: min(80vw, 380px);
          border-radius: 50%;
          border: 3px solid var(--gold);
          background: var(--paper);
          padding: 6px;
          box-sizing: border-box;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .dtc-lightbox-ring--deceased {
          border-color: var(--deceased);
        }
        .dtc-lightbox-img--deceased {
          filter: grayscale(1) contrast(0.96);
        }

        .dtc-lightbox-img,
        .dtc-lightbox-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .dtc-lightbox-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(169, 128, 60, 0.14);
          color: var(--gold);
        }

        .dtc-lightbox-name {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 20px;
          color: #F6F1E4;
          margin-top: 20px;
          text-align: center;
        }

        .dtc-lightbox-close {
          position: absolute;
          top: -46px;
          right: -4px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.12);
          color: #F6F1E4;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }
        .dtc-lightbox-close:hover {
          background: rgba(255,255,255,0.22);
        }
      `}</style>

      <div
        className={`detail-card ${isDeceased ? "detail-card--deceased" : ""}`}
        style={{ borderTopColor: topColor }}
      >
        <div
          onClick={() => {
            setLightboxBroken(false);
            setLightboxOpen(true);
          }}
        >
          <Portrait person={person} ringColor={topColor} isDeceased={isDeceased} />
        </div>

        <p className="detail-name">{person.name}</p>

        {person.dob && (
          <div className="detail-row">
            <span className="detail-label">
              <Icon src={BirthdayIcon} alt="Birthday" size={13} /> Birthday
            </span>
            <span className="detail-val">{person.dob}</span>
          </div>
        )}
        {person.PhoneNo && (
          <div className="detail-row">
            <span className="detail-label">Phone</span>
            <span className="detail-val">{person.PhoneNo}</span>
          </div>
        )}
        {person.CurrentResidence && (
          <div className="detail-row">
            <span className="detail-label">
              <Icon src={Home} alt="Home" size={13} /> Residence
            </span>
            <span className="detail-val">{person.CurrentResidence}</span>
          </div>
        )}
        {person.dod && (
          <div className="detail-row">
            <span className="detail-label">
              <Icon src={PassedAwayIcon} alt="Passed away" size={13} /> Passed away
            </span>
            <span className="detail-val">{person.dod}</span>
          </div>
        )}
        {typeof person.children !== "undefined" && (
          <div className="detail-row">
            <span className="detail-label">
              <Icon src={KidsIcon} alt="Children" size={13} /> Children
            </span>
            <span className="detail-val">{person.children?.length || 0}</span>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="dtc-lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="dtc-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="dtc-lightbox-close"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <div
              className={`dtc-lightbox-ring ${
                isDeceased ? "dtc-lightbox-ring--deceased" : ""
              }`}
            >
              {!lightboxBroken ? (
                <img
                  src={lightboxSrc}
                  alt={person.name}
                  className={`dtc-lightbox-img ${
                    isDeceased ? "" : ""
                  }`}
                  onError={() => setLightboxBroken(true)}
                />
              ) : (
                <div className="dtc-lightbox-fallback">
                  <NoProfileIcon />
                </div>
              )}
            </div>

            <p className="dtc-lightbox-name">{person.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Detail modal (bottom sheet on mobile)
// ──────────────────────────────────────────────────────────
function Modal({ person, onClose }) {
  if (!person) return null;
  const anniversary = getAnniversary(person);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {anniversary && (
          <div className="modal-anniversary">
            <Icon src={MarryIcon} alt="Anniversary" size={16} />
            <span>{anniversary}</span>
          </div>
        )}

        <div className="modal-cards">
          <DetailCard person={person} />

          {person.spouse?.name && (
            <>
              <p className="spouse-label">Spouse</p>
              <DetailCard person={person.spouse} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Single tree node (recursive)
// ──────────────────────────────────────────────────────────
function PersonNode({ person, onSelect, collapsed, onToggle }) {
  const hasKids = person.children?.length > 0;
  const isCollapsed = collapsed[person.id];
  const isDeceased = !!person.dod;
  const topColor = nodeTopColor(person);
  const kidCount = person.children?.length || 0;
  const descCount = countDescendants(person);
  const anniversary = getAnniversary(person);

  return (
    <div className="node-wrap">
      <div className="node-row">
        {/* Collapse / expand toggle */}
        {hasKids ? (
          <button
            className="toggle-btn"
            onClick={() => onToggle(person.id)}
            aria-label={isCollapsed ? "Expand branch" : "Collapse branch"}
          >
            {isCollapsed ? "▶" : "▼"}
          </button>
        ) : (
          <div className="toggle-spacer" />
        )}

        {/* Card */}
        <div
          className={`person-card-node ${
            isDeceased ? "person-card-node--deceased" : ""
          }`}
          style={{ borderTopColor: topColor }}
          onClick={() => onSelect(person)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelect(person)}
          aria-label={`View details for ${person.name}`}
        >
          {person.spouse?.name ? (
            <p className="node-couple-names">
              <span className="node-name">{person.name}</span>
              <Icon src={HeartIcon} alt="Married to" size={16} className="heart-icon" />
              <span className="node-name">{person.spouse.name}</span>
            </p>
          ) : (
            <p className="node-name">{person.name}</p>
          )}

          <div className="node-meta">
            {anniversary && (
              <span className="badge badge--anniversary">
                <Icon src={MarryIcon} alt="Anniversary" size={12} /> {anniversary}
              </span>
            )}
            {kidCount > 0 && (
              <span className="badge badge--kids">
                <Icon src={KidsIcon} alt="Children" size={12} /> {kidCount} child
                {kidCount > 1 ? "ren" : ""}
              </span>
            )}
            {isDeceased && (
              <span className="badge badge--deceased">
                <Icon src={PassedAwayIcon} alt="Passed away" size={12} /> {person.dod}
              </span>
            )}
            {isCollapsed && descCount > 0 && (
              <span className="collapsed-hint">
                {descCount} member{descCount > 1 ? "s" : ""} hidden
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasKids && !isCollapsed && (
        <div className="node-children">
          {person.children.map((child) => (
            <PersonNode
              key={child.id}
              person={child}
              onSelect={onSelect}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Root component
// ──────────────────────────────────────────────────────────
export default function NewTree() {
  const [collapsed, setCollapsed] = useState(() => {
    const map = {};
    function mark(person) {
      if (person.children?.length > 0) {
        map[person.id] = true;
        person.children.forEach(mark);
      }
    }
    mark(family);
    return map;
  });
  const [selectedPerson, setSelectedPerson] = useState(null);

  const handleToggle = useCallback((id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSelect = useCallback((person) => {
    setSelectedPerson(person);
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsed({});
  }, []);

  const handleCollapseAll = useCallback(() => {
    const ids = getAllParentIds(family);
    const map = {};
    ids.forEach((id) => (map[id] = true));
    setCollapsed(map);
  }, []);

  const memberCount = countAllMembers(family);
  const generationCount = countGenerations(family);

  return (
    <div className="tree-page">
      <TreeHeader
  onExpandAll={handleExpandAll}
  onCollapseAll={handleCollapseAll}
  memberCount={memberCount}
  generationCount={generationCount}
/>
      <Pop />

      <div className="tree-body">
        <PersonNode
          person={family}
          onSelect={handleSelect}
          collapsed={collapsed}
          onToggle={handleToggle}
        />
      </div>

      {selectedPerson && (
        <Modal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}
    </div>
  );
}