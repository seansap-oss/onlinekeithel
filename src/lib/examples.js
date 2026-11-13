import { categoryCatalog } from './categories.js';

// Illustrated starter listings help new sellers understand the fields and tone.
// They are deliberately marked as examples and are not purchasable stock.
const imageFor = (id, name = '') => {
  const key = `${id} ${name}`.toLowerCase();
  if (/boat|watercraft|marine/.test(key)) return 'oo-bike-repair.webp';
  if (/car|vehicle|motor|scooter|bicycle|cycle|transport/.test(key)) return id === 'vehicles' ? 'car.jpg' : 'oo-scooter.webp';
  if (/property|home|stay|hotel|room|land/.test(key)) return 'oo-apartment.webp';
  if (/cloth|fashion|handloom|phanek|textile/.test(key)) return 'phanek.webp';
  if (/phone|mobile|computer|electronic|audio|av|camera/.test(key)) return id === 'mobiles' ? 'phone.jpg' : 'headphones.jpg';
  if (/construction|architect|contract|warehouse|tool|electrical|plumb|paint|machinery|safety/.test(key)) return 'oo-construction.webp';
  if (/food|farm|garden|plant|pet/.test(key)) return 'oo-agriculture.webp';
  if (/beauty|personal care/.test(key)) return 'oo-clothing-shop.webp';
  if (/job|career/.test(key)) return 'oo-construction.webp';
  if (/event|education|book|kid|toy|sport|music/.test(key)) return 'oo-toys.webp';
  return 'shop.jpg';
};
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const roman = ['Imphal-da available o, call touba detail gi bidu.', 'Local pickup amasung delivery arrange touba ngammi.', 'Condition adu photo-da yeng-u, price-na negotiate touba ngammi.', 'Leikai-da handover touba ngammi; interested oirabadi message touba.'];
const categoryLead = {
  fashion: ['Handwoven phanek, everyday wear', 'Cotton kurta stitched to order'], mobiles: ['Android phone, clean condition', 'Fast charger and phone cover set'],
  electronics: ['Compact Bluetooth speaker', 'Pre-owned laptop for study or work'], vehicles: ['Used manual hatchback, ready to view', 'Family scooter, papers available'],
  motorcycles: ['Manual commuter bike, fair condition', 'Scooter for daily Imphal travel'], boats: ['Small manual fishing boat', 'Lightweight local-use dinghy'],
  jobs: ['Part-time shop assistant wanted', 'Experienced worker seeking a job'], happenings: ['Weekend market and music evening', 'Community event registration open'],
  property: ['One-room rental near the main road', 'Small family home for sale'], construction: ['Locally available cement and TMT steel', 'House repair and renovation materials'],
  architecture: ['Residential house plan and drawing service', 'Site measurement and design consultation'], contractors: ['Mason team for home extension', 'Electrician available for house wiring'],
  warehouse: ['Used steel storage racks', 'Pallets and packing supplies'], tools: ['Hand tool set for home repair', 'Drill machine with accessories'],
  electrical: ['LED lights and wiring supplies', 'Solar inverter installation enquiry'], plumbing: ['Bathroom fittings set', 'Water tank and pipe accessories'],
  finishes: ['Interior wall paint, sealed tins', 'Floor tiles for a small room'], machinery: ['Mini excavator hire by the day', 'Concrete mixer available for rent'],
  safety: ['Fire extinguisher for shop or home', 'Safety helmet and reflective vest'], logistics: ['Pickup and goods transport within Imphal', 'Small shifting service, local routes'],
  bicycles: ['Single-speed cycle for daily commute', 'Children’s bicycle, used condition'], appliances: ['Second-hand refrigerator, working', 'Rice cooker and kitchen appliances'],
  food: ['Fresh seasonal vegetables from local farm', 'Homemade snacks, order in advance'], agriculture: ['Seedlings and garden soil', 'Poultry feed and farm supplies'],
  beauty: ['Home salon appointment slots', 'Makeup service for small functions'], sports: ['Cricket bat and ball set', 'Dumbbells for home workout'],
  kids: ['Children’s storybook bundle', 'Wooden blocks and learning toys'], pets: ['Pet food and basic supplies', 'Local pet grooming appointment'],
  education: ['Class 10 maths tuition, evening batch', 'Used school books, good condition'], events: ['Birthday decoration and gift hamper', 'Handmade gift items for celebration'],
  business: ['Small business bookkeeping service', 'Printing and visiting card order'], services: ['Home appliance repair visit', 'Bicycle puncture and service'],
  retail: ['Household essentials and batteries', 'Mixed goods available for local pickup'], freebies: ['Free bookshelf, pickup from locality', 'Looking for a used study table'],
};
const isJob = (id) => id === 'jobs';
export function exampleEntries(categories = categoryCatalog, settings = {}) {
  if (Array.isArray(settings.example_entries)) return settings.example_entries;
  return categories.filter(c => c.active !== false).flatMap((c) => {
    const children = (c.subcategories || []).filter(s => s.active !== false);
    const topics = categoryLead[c.id] || [`${c.name}: local listing`, `${c.name}: service or item available`];
    const targets = children.length ? children : [{ id: 'general', name: c.name }];
    return targets.map((s, i) => {
      const title = topics[i % topics.length].replace(/^(.*?): /, (_m, prefix) => prefix === c.name ? '' : `${prefix}: `);
      const jobSeek = isJob(c.id) && /seeking|looking|worker/i.test(title);
      const detail = jobSeek
        ? 'Available for full-time, part-time or casual work. Add experience, preferred hours, expected pay and the areas you can travel to.'
        : isJob(c.id)
          ? 'Share the role, work location, hours, pay range, required skills and how applicants should apply. Part-time and casual options can be included.'
          : `Describe your ${s.name.toLowerCase()} item or offer with its condition, size or specifications, price, availability and pickup area. ${roman[(i + c.id.length) % roman.length]}`;
      const price = c.id === 'boats' ? (i % 2 ? 8500 : 12000) : c.id === 'jobs' ? 0 : c.id === 'freebies' ? 0 : 500 + ((i * 137 + c.id.length * 53) % 9500);
      return {
        id: `example-${c.id}-${slug(s.id || s.name)}`,
        category: c.id,
        subcategory: s.id,
        title,
        subtitle: `${s.name} · ${['Imphal', 'Khurai', 'Thoubal', 'Bishnupur'][i % 4]}`,
        description: `${detail} ${roman[i % roman.length]}`,
        image: `/images/${imageFor(c.id, s.name)}`,
        price,
        location: ['Imphal', 'Khurai, Imphal', 'Thoubal', 'Bishnupur'][i % 4],
        status: 'example',
        isExample: true,
      };
    });
  });
}
