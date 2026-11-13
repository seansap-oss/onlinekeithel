import React, { useEffect, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";

const labelFor = (category) => category.id === "property" ? "Real Estate" : category.name;

export function PostingCategoryPicker({ categories, categoryId, subcategoryId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState("");
  const [query, setQuery] = useState("");
  const root = useRef(null);
  const search = useRef(null);
  const trigger = useRef(null);
  const active = categories.filter((category) => category.active !== false);
  const selected = active.find((category) => category.id === categoryId);
  const selectedChild = selected?.subcategories?.find((child) => child.id === subcategoryId);
  const construction = active.filter((category) => category.group_name === "Build & industry");
  const groups = active.reduce((rows, category) => {
    if (category.group_name === "Build & industry") {
      if (!rows.includes("construction")) rows.push("construction");
    } else rows.push(category);
    return rows;
  }, []);
  const matching = (category) => [labelFor(category), category.name, ...(category.subcategories || []).map((child) => child.name)].join(" ").toLowerCase().includes(query.trim().toLowerCase());

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    const onOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onOutside); };
  }, [open]);

  const choose = (category, child = "") => {
    onSelect(category.id, child);
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => trigger.current?.focus());
  };
  const row = (category) => {
    const children = (category.subcategories || []).filter((child) => child.active !== false);
    const visible = query.trim() ? children.filter((child) => child.name.toLowerCase().includes(query.trim().toLowerCase())) : children;
    const showChildren = expanded === category.id || Boolean(query.trim());
    return <div className="posting-category-group" key={category.id}>
      <button type="button" className="posting-category-row" aria-expanded={showChildren} onClick={() => setExpanded(showChildren ? "" : category.id)}>
        <span><strong>{labelFor(category)}</strong>{category.id === "property" && <small>Homes &amp; Stays</small>}</span>
        <CaretDown size={18} className={showChildren ? "is-open" : ""} />
      </button>
      {showChildren && <div className="posting-category-children">
        <button type="button" className="posting-category-choice" onClick={() => choose(category)}>
          <span className={categoryId === category.id && !subcategoryId ? "category-radio selected" : "category-radio"} /> All {labelFor(category)}
        </button>
        {(visible.length ? visible : children).map((child) => <button type="button" key={child.id} className="posting-category-choice" onClick={() => choose(category, child.id)}>
          <span className={categoryId === category.id && subcategoryId === child.id ? "category-radio selected" : "category-radio"} />{child.name}
        </button>)}
      </div>}
    </div>;
  };
  return <div className="posting-category-picker" ref={root}>
    <span className="field-label" id="posting-category-label">Marketplace category</span>
    <button ref={trigger} type="button" className="posting-category-trigger" aria-labelledby="posting-category-label posting-category-value" aria-expanded={open} onClick={() => { setExpanded(categoryId); setOpen(!open); }}>
      <span id="posting-category-value">{selected ? labelFor(selected) : "Choose a category"}{selectedChild && <small>{selectedChild.name}</small>}</span><CaretDown size={20} />
    </button>
    {open && <><div className="posting-category-mobile-backdrop" onClick={() => setOpen(false)} />
      <div className="posting-category-panel" role="dialog" aria-modal="true" aria-label="Choose category">
        <div className="posting-category-panel-heading"><strong>Choose category</strong><button type="button" aria-label="Close category picker" onClick={() => setOpen(false)}><X size={22} /></button></div>
        <label className="posting-category-search"><MagnifyingGlass size={19} /><input ref={search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a category or subcategory" aria-label="Find a category or subcategory" /></label>
        <div className="posting-category-scroll">
          {groups.filter((entry) => entry === "construction" ? construction.some(matching) : matching(entry)).map((entry) => entry === "construction" ? <div className="posting-category-department" key="construction">
            <button type="button" className="posting-category-row" aria-expanded={expanded === "construction-department" || Boolean(query.trim())} onClick={() => setExpanded(expanded === "construction-department" ? "" : "construction-department")}>Construction <CaretDown size={18} className={expanded === "construction-department" || query.trim() ? "is-open" : ""} /></button>
            {(expanded === "construction-department" || query.trim()) && construction.filter(matching).map(row)}
          </div> : row(entry))}
          {!active.some(matching) && <p className="muted">No matching category. Try a shorter search.</p>}
        </div>
        <p className="posting-category-hint">Choose a category and, if useful, a subcategory.</p>
      </div></>}
  </div>;
}
