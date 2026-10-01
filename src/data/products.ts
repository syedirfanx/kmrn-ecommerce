import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Studio Pro Headphones',
    category: 'Audio',
    price: 32000,
    description: 'Over-ear acoustic architecture with precision 40mm titanium drivers and 40 hour battery life.',
    details: 'Engineered for neutral sound reproduction and long listening sessions. Features memory foam ear cushions wrapped in protein leather, active noise cancellation, and low latency Bluetooth 5.3.',
    specs: [
      { label: 'Driver Size', value: '40mm Titanium' },
      { label: 'Battery Life', value: '40 Hours' },
      { label: 'Connectivity', value: 'Bluetooth 5.3 and 3.5mm Aux' },
      { label: 'Charging', value: 'USB-C Fast Charging' },
      { label: 'Weight', value: '265 grams' }
    ],
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-2',
    name: 'Automatic Field Watch',
    category: 'Timepieces',
    price: 39500,
    description: 'Mechanical movement encased in brushed 316L stainless steel with scratch resistant sapphire crystal.',
    details: 'A resilient field watch designed for daily wear. Driven by a 24 jewel Japanese automatic movement with a 41 hour power reserve. Water resistant to 50 meters with Super-LumiNova hour markers.',
    specs: [
      { label: 'Case Diameter', value: '38mm' },
      { label: 'Movement', value: 'Japanese Automatic (24 Jewels)' },
      { label: 'Glass', value: 'Double Domed Sapphire Crystal' },
      { label: 'Water Resistance', value: '50 Meters / 5 ATM' },
      { label: 'Strap', value: '20mm Horween Leather' }
    ],
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-3',
    name: 'Stoneware Pour-Over Carafe',
    category: 'Kitchen & Dining',
    price: 7800,
    description: 'Heat retentive stoneware dripper and matched carafe with a hand glazed matte volcanic stone finish.',
    details: 'Hand thrown ceramic coffee maker optimized for extraction. The cone interior features balanced spiral ribs for consistent flow rate, while the thick ceramic walls preserve brew temperature.',
    specs: [
      { label: 'Carafe Volume', value: '650 ml' },
      { label: 'Material', value: 'High Fire Stoneware Ceramic' },
      { label: 'Compatibility', value: 'Standard Size 02 Paper Filters' },
      { label: 'Care', value: 'Dishwasher and Microwave Safe' },
      { label: 'Origin', value: 'Handmade in Portugal' }
    ],
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-4',
    name: 'Heavyweight Merino Overshirt',
    category: 'Apparel',
    price: 22500,
    description: 'Dense 350 GSM boiled merino wool with genuine horn buttons and twin utility chest pockets.',
    details: 'Constructed from extra fine Australian merino wool naturally resistant to wind, moisture, and odors. Tailored with reinforced seams, clean button cuffs, and a versatile structured collar.',
    specs: [
      { label: 'Material', value: '100% Boiled Merino Wool' },
      { label: 'Weight', value: '350 GSM Heavyweight' },
      { label: 'Hardware', value: 'Natural Horn Buttons' },
      { label: 'Fit', value: 'Relaxed Tailored Cut' },
      { label: 'Care', value: 'Dry Clean Only' }
    ],
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-5',
    name: 'Tuscan Leather Briefcase',
    category: 'Leather Goods',
    price: 48000,
    description: 'Vegetable tanned full grain leather with solid brushed brass hardware and a padded 16 inch laptop compartment.',
    details: 'Built by heritage leather artisans in Tuscany. Treated with natural vegetable waxes that develop a rich patina through years of use. Includes a removable padded shoulder strap and dual organizer pockets.',
    specs: [
      { label: 'Leather Type', value: 'Full Grain Tuscan Cowhide' },
      { label: 'Hardware', value: 'Solid Antiqued Brass' },
      { label: 'Capacity', value: 'Fits up to 16 inch Laptops' },
      { label: 'Dimensions', value: '41cm x 30cm x 9cm' },
      { label: 'Strap', value: 'Detachable Cotton Canvas & Leather' }
    ],
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  }
];

export const CATEGORIES = [
  'All',
  'Audio',
  'Timepieces',
  'Kitchen & Dining',
  'Apparel',
  'Leather Goods'
] as const;
