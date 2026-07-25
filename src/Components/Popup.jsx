import { useState, useMemo } from "react";
import family from "./NewData";
import PassedAwayIcon from "/PassedAway.png";
import "./Popup.css";

// ---- date helpers (dd/mm/yyyy, year-agnostic match) ----
function parseDMY(str) {
  if (!str) return null;
  const parts = str.split("/");
  // accept both "dd/mm" and "dd/mm/yyyy" — only day & month are used anyway
  if (parts.length !== 2 && parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (Number.isNaN(day) || Number.isNaN(month)) return null;
  return { day, month };
}

function sameDayMonth(dateStr, target) {
  const parsed = parseDMY(dateStr);
  if (!parsed) return null;
  if (parsed.day === target.day && parsed.month === target.month) return parsed;
  return null;
}

function honorific(gender) {
  if (String(gender).toLowerCase() === "male") return "Shri";
  if (String(gender).toLowerCase() === "female") return "Smt.";
  return "";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(parsed) {
  return `${parsed.day} ${MONTHS[parsed.month - 1]}`;
}

// ---- walk the tree (accepts a single root object OR an array of roots) ----
function collectEvents(rootOrRoots, target) {
  const roots = Array.isArray(rootOrRoots) ? rootOrRoots : [rootOrRoots];
  const events = [];

  function visitPerson(person) {
    if (!person || !person.name) return;

    const dobMatch = sameDayMonth(person.dob, target);
    if (dobMatch) {
      if (person.dod) {
        // they've passed away — a subtle remembrance instead of a celebratory glow
        events.push({ type: "birthday-remembrance", key: `bd-${person.id}`, name: person.name, gender: person.gender, date: dobMatch });
      } else {
        events.push({ type: "birthday", key: `b-${person.id}`, name: person.name, date: dobMatch });
      }
    }

    const dodMatch = sameDayMonth(person.dod, target);
    if (dodMatch) {
      events.push({ type: "remembrance", key: `r-${person.id}`, name: person.name, gender: person.gender, date: dodMatch });
    }
  }

  function visitCouple(person, spouse) {
    if (!spouse || !spouse.name) return;
    visitPerson(spouse);

    // anniversary can live on either partner's record
    const annStr = person.ann || spouse.ann;
    const annMatch = sameDayMonth(annStr, target);
    if (annMatch) {
      const eitherDeceased = Boolean(person.dod) || Boolean(spouse.dod);
      events.push({
        type: eitherDeceased ? "anniv-remember" : "anniv-alive",
        key: `a-${person.id}-${spouse.id}`,
        nameA: person.name,
        nameB: spouse.name,
        date: annMatch,
      });
    }
  }

  function walk(person) {
    visitPerson(person);
    if (person.spouse) visitCouple(person, person.spouse);
    if (Array.isArray(person.children)) person.children.forEach(walk);
  }

  roots.forEach(walk);
  return events;
}

function OccasionCard({ event, onClose }) {
  if (event.type === "birthday") {
    return (
      <div className="fo-card fo-birthday">
        <button className="fo-close" onClick={onClose} aria-label="Dismiss">&times;</button>
        <div className="fo-eyebrow">Birthday</div>
        <p className="fo-title">It&rsquo;s {event.name}&rsquo;s birthday today!</p>
        <p className="fo-body">{formatDate(event.date)}</p>
      </div>
    );
  }

  if (event.type === "birthday-remembrance") {
    return (
      <div className="fo-card fo-birthday-remembrance">
        <button className="fo-close" onClick={onClose} aria-label="Dismiss">&times;</button>
        <img src={PassedAwayIcon} alt="" className="fo-bird" />
        <div className="fo-eyebrow">In Loving Memory</div>
        <p className="fo-title">Let us remember {honorific(event.gender)} {event.name}</p>
        <p className="fo-body">
          on their birthday today, {formatDate(event.date)}.
        </p>
      </div>
    );
  }

  if (event.type === "remembrance") {
    return (
      <div className="fo-card fo-remembrance">
        <button className="fo-close" onClick={onClose} aria-label="Dismiss">&times;</button>
        <img src={PassedAwayIcon} alt="" className="fo-bird" />
        <div className="fo-eyebrow">Remembrance</div>
        <p className="fo-title">Let us remember</p>
        <p className="fo-body">
          {honorific(event.gender)} {event.name} on their death anniversary, {formatDate(event.date)}.
        </p>
      </div>
    );
  }

  if (event.type === "anniv-remember") {
    return (
      <div className="fo-card fo-anniv-remember">
        <button className="fo-close" onClick={onClose} aria-label="Dismiss">&times;</button>
        <div className="fo-eyebrow">Wedding Anniversary</div>
        <p className="fo-title">Happy anniversary, {event.nameA} &amp; {event.nameB}</p>
        <p className="fo-body">
          Remembering your special day and celebrating the love you shared. Thinking of you today.
        </p>
      </div>
    );
  }

  if (event.type === "anniv-alive") {
    return (
      <div className="fo-card fo-anniv-alive">
        <button className="fo-close" onClick={onClose} aria-label="Dismiss">&times;</button>
        <div className="fo-eyebrow">Wedding Anniversary</div>
        <p className="fo-title">{event.nameA} &amp; {event.nameB}</p>
        <p className="fo-body">
          Wishing you a wonderful anniversary filled with love, laughter, and many more happy years together.
        </p>
      </div>
    );
  }

  return null;
}

export default function Pop() {
  const [dismissed, setDismissed] = useState(() => new Set());

  const target = useMemo(() => {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth() + 1 };
  }, []);

  const events = useMemo(() => collectEvents(family, target), [target]);
  const visibleEvents = events.filter((e) => !dismissed.has(e.key));

  if (visibleEvents.length === 0) return null;

  function dismiss(key) {
    setDismissed((prev) => new Set(prev).add(key));
  }

  return (
    <div className="fo-stack">
      {visibleEvents.map((event) => (
        <OccasionCard key={event.key} event={event} onClose={() => dismiss(event.key)} />
      ))}
    </div>
  );
}