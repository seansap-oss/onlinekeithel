import test from "node:test";
import assert from "node:assert/strict";
import { categoryCatalog } from "../src/lib/categories.js";
import { shopCategoryProfile, shopCategoryId } from "../src/lib/storefront-categories.js";
import { storefrontSettings } from "../src/lib/storefront.js";
import { filterShopListings } from "../src/lib/shop-filters.js";
import { shopDepartments, shopStarterCollections } from "../src/lib/shop-departments.js";

test("every admin category has a complete shop menu and owner collection ideas", () => {
  for (const category of categoryCatalog) {
    const menu = shopDepartments(category);
    assert.ok(menu.length, category.id);
    assert.deepEqual(menu.flatMap(group => group.entries.map(entry => entry.id)), category.subcategories.map(entry => entry.id));
    assert.ok(shopStarterCollections(category).length, category.id);
  }
  assert.ok(shopStarterCollections(categoryCatalog.find(c=>c.id === "fashion")).includes("Socks"));
  const added = { id: "custom", name: "Crafts", subcategories: [{ id: "pottery", name: "Pottery" }] };
  assert.equal(shopDepartments(added)[0].entries[0].id, "pottery");
});

test("all marketplace categories produce seller pages and editable collection starters", () => {
  assert.ok(categoryCatalog.length >= 36);
  for (const category of categoryCatalog) {
    const profile = shopCategoryProfile(category.id);
    assert.equal(profile.id, category.id);
    assert.ok(profile.headline);
    assert.ok(profile.layout);
    assert.deepEqual(profile.starters, category.subcategories.slice(0, 8));
    assert.ok(profile.filters.every((field) => category.fields.includes(field) || ["vehicles", "motorcycles"].includes(category.id)));
  }
  const adminCategory = { id: "catering-extra", name: "Catering", active: true, fields: ["Cuisine"], subcategories: [{ id: "party", name: "Party food" }] };
  assert.equal(shopCategoryProfile(adminCategory.id, [...categoryCatalog, adminCategory]).starters[0].name, "Party food");
  assert.equal(shopCategoryId({ storefront: { categoryId: adminCategory.id } }, [...categoryCatalog, adminCategory]), adminCategory.id);
  assert.equal(storefrontSettings({ storefront: { categoryId: adminCategory.id } }, [...categoryCatalog, adminCategory]).headline, "Discover catering nearby.");
});

test("store filters narrow detailed listings without changing owner stock", () => {
  const original = [
    { condition: "Used", price: 600000, attributes: { Make: "Hyundai", Model: "i20", Kilometres: "22000", Transmission: "Manual" }, commerce: { stock: 2 } },
    { condition: "New", price: 900000, attributes: { Make: "Tata", Model: "Nexon", Kilometres: "0", Transmission: "Automatic" }, commerce: { stock: 5 } },
  ];
  assert.deepEqual(filterShopListings(original, { attributes: { Make: "hyun", Transmission: "Manual" }, maxKilometres: "30000", maxPrice: "700000", condition: "Used" }), [original[0]]);
  assert.deepEqual(filterShopListings(original, { maxKilometres: "0" }), [original[1]]);
  assert.equal(original[0].commerce.stock, 2);
});
