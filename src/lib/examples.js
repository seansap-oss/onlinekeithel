import { categoryCatalog } from './categories.js';

// These are clearly illustrative profiles and ads. They do not claim real stock or availability.
const curated = {
  fashion: ['Home tailoring & handloom', 'Cotton phanek and made-to-measure clothing', 'oo-clothing-shop.webp', 'A home clothing business can show finished pieces, sizes, custom orders, delivery areas and a gallery of recent work.'],
  mobiles: ['Independent mobile shop', 'Phones, chargers and accessories', 'oo-mobile-shop.webp', 'A local phone shop can display accessories, compatible models, repair services, opening hours and a direct enquiry link.'],
  electronics: ['Pre-owned electronics', 'Checked phones and audio accessories', 'oo-mobile-shop.webp', 'Show model, condition, photographs, what is included and whether a viewing can be arranged.'],
  vehicles: ['Second-hand car seller', 'Pre-owned vehicle listings', 'car.jpg', 'Describe model year, ownership, mileage, service history, condition and the preferred way to arrange a viewing.'],
  motorcycles: ['Blue commuter scooter', 'Two-wheeler listing example', 'oo-scooter.webp', 'A seller can include mileage, registration year, ownership, recent maintenance and clear photographs from every side.'],
  property: ['Furnished apartment to rent', 'Home and rental listing example', 'oo-apartment.webp', 'Show monthly rent, deposit, floor area, furnishing, locality, availability and photos of each room.'],
  kids: ['Toys and books bundle', 'Pre-loved items for children', 'oo-toys.webp', 'List the age range, condition, contents and collection location, with photographs of the actual items.'],
  services: ['Local bicycle repair', 'Repair and maintenance service', 'oo-bike-repair.webp', 'Explain services, typical turnaround, service area, indicative rates and before-and-after photographs.'],
  contractors: ['Steelwork and home construction', 'Welding and site services', 'oo-construction.webp', 'Show steel frames, hybrid-house work, site visits, estimates, safety practice and photographs of completed projects.'],
  jobs: ['Bricklayer seeking work', 'Skilled construction worker profile', 'oo-construction.webp', 'Example profile: eight years of bricklaying, plastering and site support. Add projects, availability, service areas, references and a contact method.'],
  tools: ['Local hardware supplier', 'Tools, fasteners and site essentials', 'oo-hardware.webp', 'A shop can organise tools by trade, list brands and sizes, display stock enquiries and provide a shareable storefront.'],
  agriculture: ['Farm and garden supplier', 'Seeds, plants and growing essentials', 'oo-agriculture.webp', 'Describe seasonal seeds, plant varieties, soil supplies, collection hours and local delivery options.'],
  home: ['Second-hand dining set', 'Furniture and home living example', 'chair.jpg', 'Include dimensions, material, condition, collection arrangements and photographs of wear or damage.'],
  bicycles: ['Bicycle and accessories', 'Cycling listing example', 'oo-bike-repair.webp', 'Show frame size, condition, components, any repairs and clear close-up photographs.'],
  freebies: ['Giveaway bookshelf', 'Collection offer example', 'chair.jpg', 'A ₹0 giveaway can explain condition, collection window, location and whether the item is reserved or available.'],
};
const imageFor = (id) => {
  if (['architecture','construction','warehouse','machinery','safety','logistics'].includes(id)) return 'oo-construction.webp';
  if (['plumbing','electrical','finishes','appliances','business'].includes(id)) return 'oo-hardware.webp';
  if (['food','pets','beauty'].includes(id)) return 'oo-agriculture.webp';
  if (['sports','boats','music'].includes(id)) return 'oo-bike-repair.webp';
  if (['education','events','happenings'].includes(id)) return 'oo-toys.webp';
  return 'shop.jpg';
};
export function exampleEntries(categories = categoryCatalog, settings = {}) {
  if (Array.isArray(settings.example_entries)) return settings.example_entries;
  return categories.filter(c => c.active !== false).flatMap((c) => {
    const [title, subtitle, image, description] = curated[c.id] || [c.name, 'Local listing example', imageFor(c.id), `This is how a local seller or service provider can describe their ${c.name.toLowerCase()} offer, including photos, location, availability and a clear way to enquire.`];
    return [
      { id: 'example-'+c.id+'-1', category: c.id, title, subtitle, description, image: '/images/'+image },
      { id: 'example-'+c.id+'-2', category: c.id, title: 'Explore '+c.name, subtitle: 'Shop and individual profile example', description: `A shareable OO page for ${c.name.toLowerCase()} can collect products, project photos, service details, pricing guidance and links in one place.`, image: '/images/'+(c.id === 'fashion' ? 'phanek.webp' : imageFor(c.id)) },
    ];
  });
}
