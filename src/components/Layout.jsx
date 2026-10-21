import { categoryRoute } from "../lib/departments";
import { categoryCatalog } from "../lib/categories";
import { categoryIcons, CategoryIcon } from "./CategoryIcon";
import { Ticker } from "./Ticker";
import { SearchPanel } from "./SearchPanel";
import React, { useState, useEffect } from "react";
import {
  List,
  Moon,
  Sun,
  MagnifyingGlass,
  MapPin,
  Storefront,
  Plus,
  Heart,
  User,
  House,
  SquaresFour,
  ArrowRight,
  TShirt,
  DeviceMobile,
  Car,
  Armchair,
  Headphones,
  Wrench,
  Bicycle,
  Buildings,
  CaretDown,
  SignOut,
} from "@phosphor-icons/react";
import { Link, useMarket } from "../lib/context";
import { Modal } from "./UI";
import { supabase } from "../lib/backend";
import {
  constructionCategories,
  isConstructionCategory,
} from "../lib/categories";
import { AdminEntry } from "./AdminEntry";
import { BrandMark } from "./BrandMark";
export const icons = Object.fromEntries(
  categoryCatalog.map((c) => [c.id, categoryIcons[c.icon]]),
);
export function Layout({ children }) {
  const { navigate, path, session, categories, settings, notice } = useMarket();
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => setSearchOpen(false), [path]);
  return (
    <>
      <header className="main-header">
        <div className="header-inner">
          <button
            className="icon-button burger"
            aria-label="Open navigation menu"
            onClick={() => setMenu(true)}
          >
            <List size={25} />
          </button>
          <Link to="/" className="brand">
            <BrandMark />
            <span>
              <b>{settings.name}</b>
              <small>
                {settings.tagline || "Our people. Our neighbourhood."}
              </small>
            </span>
          </Link>
          <button
            className="location"
            onClick={() => navigate("/search?location=Imphal")}
          >
            <MapPin size={19} /> Imphal <CaretDown size={12} />
          </button>
          <button
            className="icon-button header-search"
            aria-label="Search marketplace"
            onClick={() => setSearchOpen(true)}
          >
            <MagnifyingGlass size={23} />
          </button>
          <Link
            className="desktop-saved icon-button"
            to="/saved"
            aria-label="Saved items"
          >
            <Heart size={23} />
          </Link>
          <Link
            className="account-link"
            aria-label={session ? "My account" : "Sign in"}
            to={session ? "/dashboard" : "/login"}
          >
            <User size={22} />
            <span>{session ? "My account" : "Sign in"}</span>
          </Link>
          <button
            className="icon-button desktop-theme"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <Link className="button primary sell-header" to="/sell">
            <Plus size={19} /> Post ad
          </Link>
        </div>
      </header>
      <Ticker value={settings.ticker} />
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      <main>{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="brand" to="/">
            <BrandMark size={34} />
            <b>{settings.name}</b>
          </Link>
          <p>
            A marketplace for our people.
            <br />
            Made for the neighbourhoods of Manipur.
          </p>
        </div>
        <div>
          <b>Explore</b>
          <Link to="/search">All products</Link>
          <Link to="/shops">Local shops</Link>
          <Link to="/saved">Saved items</Link>
        </div>
        <div>
          <b>Start something</b>
          <Link to="/sell">Post ad</Link>
          <Link to="/plans">Post an ad</Link>
          <Link to="/shops">Explore shops</Link>
        </div>
        <div>
          <b>Here to help</b>
          <Link to="/help">Help & contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Marketplace terms</Link>
          <small>
            <AdminEntry /> {new Date().getFullYear()} {settings.name}
          </small>
          <small className="creator-credit">
            Created by{" "}
            <span className="creator-name">
              <a
                href="https://www.avitsolutions.tech/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Avit</span> <span>Solutions</span>
              </a>
            </span>
          </small>
        </div>
      </footer>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          ["/", House, "Home"],
          ["/categories", SquaresFour, "Categories"],
          ["/sell", Plus, "Post ad"],
          ["/saved", Heart, "Saved"],
          [session ? "/dashboard" : "/login", User, "Account"],
        ].map(([to, Icon, label]) => (
          <Link
            to={to}
            key={label}
            className={
              (label === "Post ad" ? "nav-sell " : "") +
              (path.split("?")[0] === to ? "active" : "")
            }
          >
            <Icon
              size={23}
              weight={path.split("?")[0] === to ? "fill" : "regular"}
            />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {menu && (
        <Modal title="Your neighbourhood" side onClose={() => setMenu(false)}>
          <nav className="drawer-links">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}{" "}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <Link to="/" onClick={() => setMenu(false)}>
              Marketplace home
            </Link>
            <Link to="/shops" onClick={() => setMenu(false)}>
              Browse local shops
            </Link>
            <Link to="/categories" onClick={() => setMenu(false)}>
              Browse all categories & subcategories
            </Link>
            <h3>Shop by category</h3>
            {constructionCategories(categories).length > 0 && (
              <details className="drawer-department">
                <summary>
                  <Buildings size={22} /> Construction <CaretDown size={14} />
                </summary>
                <Link
                  to="/search?department=construction"
                  onClick={() => setMenu(false)}
                >
                  All construction
                </Link>
                {constructionCategories(categories).map((c) => (
                  <Link
                    key={c.id}
                    to={categoryRoute(c.id)}
                    onClick={() => setMenu(false)}
                  >
                    {c.name}
                  </Link>
                ))}
              </details>
            )}
            {categories
              .filter((c) => !isConstructionCategory(c))
              .map((c) => {
                const Icon =
                  categoryIcons[c.icon] || icons[c.id] || SquaresFour;
                return (
                  <Link
                    to={categoryRoute(c.id)}
                    key={c.id}
                    onClick={() => setMenu(false)}
                  >
                    <Icon size={22} />
                    {c.name}
                  </Link>
                );
              })}
            <hr />
            <Link to="/dashboard" onClick={() => setMenu(false)}>
              My seller dashboard
            </Link>
            <Link to="/plans" onClick={() => setMenu(false)}>
              Sell for free
            </Link>
            <Link to="/help" onClick={() => setMenu(false)}>
              Help & contact
            </Link>
            {session && (
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) notice(error.message);
                  else {
                    setMenu(false);
                    navigate("/");
                  }
                }}
              >
                <SignOut size={20} /> Sign out
              </button>
            )}
          </nav>
        </Modal>
      )}
    </>
  );
}
