
import React, { useState, useCallback } from "react";
import family from "./NewData";
import "./NewTree.css";

// ── Your icon assets ──
import BirthdayIcon from "/Birthday.png";
import KidsIcon from "/Kids.png";
import PassedAwayIcon from "/PassedAway.png";
import HeartIcon from "/Heart.png";
import MarryIcon from "/Marry.png";
import Home from "/Home.png"
import Popup from "./Popup";

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
  return (
    <img
      src={src}
      alt={alt}
      className={`icon-img ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ──────────────────────────────────────────────────────────
// Detail modal (bottom sheet on mobile)
// ──────────────────────────────────────────────────────────
// function DetailCard({ person }) {
//   if (!person) return null;
//   const isDeceased = !!person.dod;
//   const topColor = nodeTopColor(person);
//   const anniversary = getAnniversary(person);

//   return (
//     <div
//       className={`detail-card ${isDeceased ? "detail-card--deceased" : ""}`}
//       style={{ borderTopColor: topColor }}
//     >
//       <p className="detail-name">{person.name}</p>

//       {person.dob && (
//         <div className="detail-row">
//           <span className="detail-label">
//             <Icon src={BirthdayIcon} alt="Birthday" /> Birthday
//           </span>
//           <span className="detail-val">{person.dob}</span>
//         </div>
//       )}
//       {anniversary && (
//         <div className="detail-row">
//           <span className="detail-label">
//             <Icon src={MarryIcon} alt="Anniversary" /> Anniversary
//           </span>
//           <span className="detail-val">{anniversary}</span>
//         </div>
//       )}
//       {person.PhoneNo && (
//         <div className="detail-row">
//           <span className="detail-label">Phone</span>
//           <span className="detail-val">{person.PhoneNo}</span>
//         </div>
//       )}
//       {person.CurrentResidence && (
//         <div className="detail-row">
//           <span className="detail-label">
//             <Icon src={Home} alt= "Home" /> Residence
//             </span>
//           <span className="detail-val">{person.CurrentResidence}</span>
//         </div>
//       )}
//       {person.dod && (
//         <div className="detail-row">
//           <span className="detail-label">
//             <Icon src={PassedAwayIcon} alt="Passed away" /> Passed Away
//           </span>
//           <span className="detail-val">{person.dod}</span>
//         </div>
//       )}
//       {typeof person.children !== "undefined" && (
//         <div className="detail-row">
//           <span className="detail-label">
//             <Icon src={KidsIcon} alt="Children" /> Children
//           </span>
//           <span className="detail-val">{person.children?.length || 0}</span>
//         </div>
//       )}
//     </div>
//   );
// }

// function Modal({ person, onClose }) {
//   if (!person) return null;

//   return (
//     <div className="modal-bg" onClick={onClose}>
//       <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-handle" />
//         <button className="modal-close" onClick={onClose} aria-label="Close">
//           ✕
//         </button>

//         <div className="modal-cards">
//           <DetailCard person={person} />

//           {person.spouse?.name && (
//             <>
//               <p className="spouse-label">Spouse</p>
//               <DetailCard person={person.spouse} />
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
// ──────────────────────────────────────────────────────────
// Detail modal (bottom sheet on mobile)
// ──────────────────────────────────────────────────────────
function DetailCard({ person }) {
  if (!person) return null;
  const isDeceased = !!person.dod;
  const topColor = nodeTopColor(person);

  return (
    <div
      className={`detail-card ${isDeceased ? "detail-card--deceased" : ""}`}
      style={{ borderTopColor: topColor }}
    >
      <p className="detail-name">{person.name}</p>

      {person.dob && (
        <div className="detail-row">
          <span className="detail-label">
            <Icon src={BirthdayIcon} alt="Birthday" /> Birthday
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
            <Icon src={Home} alt="Home" /> Residence
          </span>
          <span className="detail-val">{person.CurrentResidence}</span>
        </div>
      )}
      {person.dod && (
        <div className="detail-row">
          <span className="detail-label">
            <Icon src={PassedAwayIcon} alt="Passed away" /> Passed Away
          </span>
          <span className="detail-val">{person.dod}</span>
        </div>
      )}
      {typeof person.children !== "undefined" && (
        <div className="detail-row">
          <span className="detail-label">
            <Icon src={KidsIcon} alt="Children" /> Children
          </span>
          <span className="detail-val">{person.children?.length || 0}</span>
        </div>
      )}
    </div>
  );
}

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
          className={`person-card-node ${isDeceased ? "person-card-node--deceased" : ""}`}
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
      <header className="tree-header">
        <div className="tree-header-top">
          <div>
            <div className="tree-title-row">
              <i className="ti ti-git-fork tree-title-icon" aria-hidden="true" />
              <h1 className="tree-title">Family tree</h1>
            </div>
            <p className="tree-subtitle">
              Tap a name for details · use the arrows to collapse a branch
            </p>
          </div>

          <div className="tree-header-actions">
            <button className="tree-action-btn" onClick={handleExpandAll}>
              <i className="ti ti-chevrons-down" aria-hidden="true" />
              Expand all
            </button>
            <button className="tree-action-btn" onClick={handleCollapseAll}>
              <i className="ti ti-chevrons-up" aria-hidden="true" />
              Collapse all
            </button>
          </div>
        </div>

        <div className="tree-header-bottom">
          <div className="legend-item">
            <span className="legend-dot legend-dot--male" />
            <span>Male</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot--female" />
            <span>Female</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot--deceased" />
            <span>Deceased</span>
          </div>
          <div className="legend-divider" />
          <div className="tree-stats">
            <span>{memberCount} members</span>
            <span>{generationCount} generations</span>
          </div>
        </div>
      </header>
      <Popup/>

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