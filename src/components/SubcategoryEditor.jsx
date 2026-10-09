import React from "react";
import { CategoryIcon, categoryIcons } from "./CategoryIcon";
import { Field } from "./UI";
import { slugify } from "../lib/utils";
export function SubcategoryEditor({ value = [], onChange }) {
  const update = (index, patch) =>
    onChange(
      value.map((child, i) => (i === index ? { ...child, ...patch } : child)),
    );
  const move = (index, step) => {
    const next = [...value];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  };
  return (
    <section>
      <h3>Subcategories</h3>
      <p>
        Add as many as you need. Keep existing IDs so product links remain
        intact.
      </p>
      {value.map((child, index) => (
        <div className="child-category" key={index}>
          <div className="button-row">
            <CategoryIcon
              name={child.icon}
              size={24}
              color={child.color || "#064b3b"}
            />
            <button
              type="button"
              className="text-button"
              disabled={!index}
              onClick={() => move(index, -1)}
            >
              Move up
            </button>
            <button
              type="button"
              className="text-button"
              disabled={index === value.length - 1}
              onClick={() => move(index, 1)}
            >
              Move down
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
          <Field
            label="Subcategory name"
            required
            value={child.name}
            onChange={(e) => update(index, { name: e.target.value })}
          />
          <Field
            label="Stable ID"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={child.id}
            onChange={(e) => update(index, { id: e.target.value })}
            onBlur={() => {
              if (!child.id) update(index, { id: slugify(child.name) });
            }}
          />
          <Field label="Icon">
            <select
              value={child.icon || "Storefront"}
              onChange={(e) => update(index, { icon: e.target.value })}
            >
              {Object.keys(categoryIcons).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Icon colour"
            type="color"
            value={child.color || "#064b3b"}
            onChange={(e) => update(index, { color: e.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        className="button outline"
        onClick={() =>
          onChange([
            ...value,
            { id: "", name: "", icon: "Storefront", color: "#064b3b" },
          ])
        }
      >
        + Add subcategory
      </button>
    </section>
  );
}
