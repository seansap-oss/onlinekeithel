import React from 'react';
import { Link, useMarket } from '../lib/context';
import { Photo, Empty } from '../components/UI';
import { exampleEntries } from '../lib/examples';
import { categoryName } from '../lib/categories';

export function ExampleCard({ entry }) {
  return <Link className="example-card" to={'/example/'+encodeURIComponent(entry.id)}>
    <Photo src={entry.image} alt="" loading="lazy" />
    <span className="example-card-copy"><small>Example · {entry.category}</small><strong>{entry.title}</strong><span>{entry.subtitle}</span></span>
  </Link>;
}
export function ExamplePage({ id }) {
  const { categories, settings } = useMarket();
  const entry = exampleEntries(categories, settings).find(x => x.id === id);
  if (!entry) return <div className="page"><Empty title="Example unavailable">This page was removed by the administrator.</Empty></div>;
  const related = exampleEntries(categories, settings).filter(x => x.category === entry.category && x.id !== id);
  return <div className="page example-detail">
    <p className="eyebrow">OO · ONLINE OFFER · EXAMPLE PAGE</p>
    <div className="example-detail-layout">
      <Photo src={entry.image} alt={entry.title} />
      <div><small>{categoryName(categories, entry.category)}</small><h1>{entry.title}</h1><p>{entry.subtitle}</p><p>{entry.description}</p>
      <p className="notice-box">This is an example of a page you can create on OO. It is not a live seller or job seeker.</p>
      <Link className="button primary" to="/sell">Create your own listing</Link> <Link className="button outline" to={'/search?category='+encodeURIComponent(entry.category)}>Browse live listings</Link></div>
    </div>
    {related.length > 0 && <section className="section"><h2>More ways to use this category</h2><div className="example-grid">{related.map(x=><ExampleCard key={x.id} entry={x} />)}</div></section>}
  </div>;
}

export const defaultProfiles = [
  {slug:'home-clothing',name:'Home clothing business',category:'fashion',hero:'oo-clothing-shop.webp',intro:'A home maker can use a shareable storefront to show handloom pieces, stitched clothing, sizes, custom work and a gallery of finished orders.',offers:[['Phanek and handloom','phanek.webp'],['Everyday clothing','oo-clothing-shop.webp'],['Custom tailoring','fashion.jpg']]},
  {slug:'pre-owned',name:'Second-hand seller',category:'vehicles',hero:'oo-scooter.webp',intro:'An individual seller can group several pre-owned items with honest condition notes, clear photos, collection details and one profile link.',offers:[['Commuter scooter','oo-scooter.webp'],['Furniture','chair.jpg'],['Phone','phone.jpg']]},
  {slug:'mobile-shop',name:'Mobile phone shop',category:'mobiles',hero:'oo-mobile-shop.webp',intro:'A phone shop can organise devices, cases, chargers and repair services. Each item can have its own description, condition and enquiry link.',offers:[['Phones','phone.jpg'],['Accessories','oo-mobile-shop.webp'],['Audio','headphones.jpg']]},
  {slug:'construction-worker',name:'Construction worker profile',category:'jobs',hero:'oo-construction.webp',intro:'Example worker profile: eight years of bricklaying, plastering and manual site work. A real worker can add project photographs, experience, availability, references and the areas they serve.',offers:[['Bricklaying','oo-construction.webp'],['Site work','oo-hardware.webp'],['Project history','oo-apartment.webp']]},
];
export const exampleProfiles = (settings) => Array.isArray(settings?.example_profiles) ? settings.example_profiles : defaultProfiles;
export function ExampleShops() { const {settings}=useMarket(); return <section className="section oo-profile-section"><div className="section-heading"><div><span className="eyebrow">SHAREABLE OO PAGES</span><h2>See what your page could look like</h2></div><Link to="/sell">Create yours →</Link></div><div className="oo-profile-grid">{exampleProfiles(settings).map(p=><Link className="oo-profile-card" key={p.slug} to={'/example-shop/'+p.slug}><Photo src={'/images/'+p.hero} alt="" loading="lazy" /><div><small>Example profile</small><strong>{p.name}</strong><span>Explore page →</span></div></Link>)}</div></section>; }
export function ExampleShopPage({ slug }) {
 const {settings}=useMarket();
 const p=exampleProfiles(settings).find(x=>x.slug===slug);
 if(!p) return <div className="page"><Empty title="Page unavailable" /></div>;
 return <div className="page example-shop-page"><div className="example-shop-hero"><Photo src={'/images/'+p.hero} alt="" /><div><span className="eyebrow">OO · ONLINE OFFER · EXAMPLE PROFILE</span><h1>{p.name}</h1><p>{p.intro}</p><Link className="button primary" to="/sell">Create a page like this</Link></div></div><section className="section"><h2>What this page can show</h2><div className="oo-profile-grid">{p.offers.map(([title,image])=><div className="oo-profile-card" key={title}><Photo src={'/images/'+image} alt="" /><div><strong>{title}</strong><small>Illustrative content</small></div></div>)}</div></section><p className="notice-box">This example is for inspiration and does not represent a real seller or available service.</p></div>;
}
