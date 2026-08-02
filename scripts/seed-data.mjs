// Seeds the running backend with demo stores and promotions for manual testing.
// Usage: node scripts/seed-data.mjs   (requires backend running on http://localhost:8080, Node 18+)

const API = 'http://localhost:8080/api';

const cities = [
  { city: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { city: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { city: 'Durban', lat: -29.8587, lng: 31.0218 },
  { city: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  { city: 'Port Elizabeth', lat: -33.9608, lng: 25.6022 },
  { city: 'Bloemfontein', lat: -29.0852, lng: 26.1596 },
  { city: 'East London', lat: -33.0153, lng: 27.9116 },
  { city: 'Stellenbosch', lat: -33.9321, lng: 18.8602 },
];

const categories = {
  GROCERY: {
    names: ['Fresh Mart', 'Corner Grocer', 'Value Foods', 'Green Basket', 'Daily Fresh', 'Pantry Plus', 'Harvest Grocer'],
    priceRange: [50, 400],
  },
  PHARMACY: {
    names: ['HealthPlus Pharmacy', 'City Chemist', 'Wellness Pharmacy', 'CareFirst Pharmacy', 'MediPoint', 'Family Chemist'],
    priceRange: [30, 300],
  },
  FASHION: {
    names: ['Trendy Threads', 'Urban Wear', 'Style Avenue', 'Chic Boutique', 'Denim Republic', 'Vogue Corner', 'Fashion Loft'],
    priceRange: [150, 1200],
  },
  ELECTRONICS: {
    names: ['TechHub', 'Gadget World', 'CircuitStop', 'ByteZone', 'ElectroMart', 'NextGen Electronics'],
    priceRange: [500, 8000],
  },
  RESTAURANT: {
    names: ['Spice Route', 'Burger Barn', 'Pasta Palace', 'The Grill House', 'Ocean Bites', 'Curry Corner', 'Braai Republic'],
    priceRange: [60, 350],
  },
  BEAUTY: {
    names: ['Glow Beauty Bar', 'Salon Chic', 'Radiance Spa', 'Blush Beauty', 'Luxe Nails & Hair', 'Serenity Salon'],
    priceRange: [100, 900],
  },
  HOME_GOODS: {
    names: ['Home Comforts', 'Decor Nest', 'Cozy Living', 'Furnish Co', 'The Homeware Shop', 'Nestwell Living'],
    priceRange: [200, 3000],
  },
  OTHER: {
    names: ['General Store', 'Odds & Ends', 'Corner Shop', 'Everything Store', 'The Local Spot'],
    priceRange: [50, 500],
  },
};

const promoTemplates = [
  { title: 'Weekend Special', desc: 'Limited time weekend discount on select items.' },
  { title: 'Clearance Sale', desc: 'Massive clearance to make room for new stock.' },
  { title: 'Buy More, Save More', desc: 'The more you buy, the more you save this week.' },
  { title: 'Flash Deal', desc: '24-hour flash deal, while stocks last.' },
  { title: 'Loyalty Discount', desc: 'Exclusive discount for DealNest shoppers.' },
  { title: 'Season Sale', desc: 'End of season sale on top picks.' },
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function jitter(base, spread) { return base + (Math.random() - 0.5) * spread; }

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function main() {
  const catKeys = Object.keys(categories);
  const targetCount = 54; // ~6-7 per category across 8 categories
  const usedNames = new Set();
  let storeCount = 0;
  let promoCount = 0;
  let storeFailures = 0;
  let promoFailures = 0;

  for (let i = 0; i < targetCount; i++) {
    const catKey = catKeys[i % catKeys.length];
    const cat = categories[catKey];
    const loc = rand(cities);

    let name = rand(cat.names);
    let uniqueName = name;
    let suffix = 2;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${name} ${suffix}`;
      suffix++;
    }
    usedNames.add(uniqueName);

    const slug = uniqueName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const store = {
      storeName: uniqueName,
      category: catKey,
      description: `${uniqueName} - your local ${catKey.toLowerCase().replace('_', ' ')} spot in ${loc.city}.`,
      email: `${slug}${i}@dealnest-demo.co.za`,
      phoneNumber: `08${randInt(1, 9)}${randInt(1000000, 9999999)}`,
      address: `${randInt(1, 200)} ${rand(['Main Rd', 'Church St', 'Long St', 'Voortrekker Rd', 'Market St', 'Station Rd'])}`,
      city: loc.city,
      latitude: jitter(loc.lat, 0.1),
      longitude: jitter(loc.lng, 0.1),
    };

    let created;
    try {
      created = await post('/stores', store);
      storeCount++;
    } catch (err) {
      storeFailures++;
      console.error('STORE FAILED:', err.message);
      continue;
    }

    // 0-2 promotions per store
    const promoNum = randInt(0, 2);
    for (let p = 0; p < promoNum; p++) {
      const tmpl = rand(promoTemplates);
      const [min, max] = cat.priceRange;
      const original = randInt(min, max);
      const discountPct = rand([10, 15, 20, 25, 30, 40, 50]);
      const discounted = Math.round(original * (1 - discountPct / 100));
      const start = new Date();
      const end = new Date(Date.now() + randInt(3, 30) * 24 * 60 * 60 * 1000);

      const promo = {
        title: `${tmpl.title} - ${discountPct}% Off`,
        description: tmpl.desc,
        originalPrice: original,
        discountPrice: discounted,
        discountPercentage: discountPct,
        startDate: start.toISOString().slice(0, 19),
        endDate: end.toISOString().slice(0, 19),
        isActive: true,
        store: { storeId: created.storeId },
      };

      try {
        await post('/promotion/create', promo);
        promoCount++;
      } catch (err) {
        promoFailures++;
        console.error('PROMO FAILED:', err.message);
      }
    }
  }

  console.log(`\nDone. Stores created: ${storeCount} (failed: ${storeFailures}). Promotions created: ${promoCount} (failed: ${promoFailures}).`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
