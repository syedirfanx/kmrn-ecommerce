import { Product } from '../types';

export const PRODUCTS: Product[] = [
  // 1. Elegant Women's Wear (Original Pakistani Dresses)
  {
    id: 'prod-pw-1',
    name: 'Baroque Luxury Embroidered Chiffon 3-Piece',
    category: "Elegant Women's Wear",
    subcategory: 'Luxury Chiffon',
    price: 13500,
    description: '100% original imported Pakistani 3-piece luxury unstitched suit featuring heavy hand-embellished zari and sequin embroidery.',
    details: 'Complete 3-piece designer suit. Embroidered chiffon front and back, heavy hand-embellished neckline patch, embroidered chiffon sleeves, digital printed silk dupatta, and dyed raw silk trousers.',
    specs: [
      { label: 'Origin', value: '100% Original Pakistani Import' },
      { label: 'Shirt Fabric', value: 'Pure Chiffon with Zari & Sequins' },
      { label: 'Dupatta', value: 'Embroidered Net with 4-Side Lace' },
      { label: 'Trouser', value: 'Dyed Raw Silk (2.5 Meters)' },
      { label: 'Type', value: 'Unstitched 3-Piece Luxury Suit' }
    ],
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    featured: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-pw-2',
    name: 'Maria.B M.Prints Luxury Lawn 3-Piece',
    category: "Elegant Women's Wear",
    subcategory: 'Original Pakistani Lawn',
    price: 9800,
    description: 'Premium Pakistani combed lawn with intricate schiffli embroidered front, printed chiffon dupatta, and cambric trousers.',
    details: 'Authentic designer lawn collection. Includes embroidered neckline patch, printed fine lawn front and back, organza embroidered sleeve borders, chiffon dupatta, and cotton dyed trousers.',
    specs: [
      { label: 'Origin', value: '100% Original Pakistani Brand' },
      { label: 'Shirt Fabric', value: 'Superfine Combed Lawn' },
      { label: 'Dupatta', value: 'Digital Printed Pure Chiffon' },
      { label: 'Trouser', value: 'Dyed Cambric Cotton' },
      { label: 'Type', value: 'Unstitched 3-Piece' }
    ],
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    featured: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-pw-3',
    name: 'Asim Jofa Festive Embroidered Organza Suit',
    category: "Elegant Women's Wear",
    subcategory: 'Festive Embroidered',
    price: 15500,
    description: 'Original Pakistani festive couture piece crafted on pure organza with tilla work and crushed silk dupatta.',
    details: 'Grand formal festive dress. Fully embroidered organza kalis, embellished bodice, embroidered organza border for front and back daman, embroidered organza dupatta, and silk slip and trousers.',
    specs: [
      { label: 'Origin', value: '100% Original Pakistani Formal' },
      { label: 'Shirt Fabric', value: 'Embroidered Pure Organza' },
      { label: 'Dupatta', value: 'Embroidered Organza with Tassels' },
      { label: 'Slip & Trouser', value: 'Dyed Viscose Raw Silk' },
      { label: 'Work Technique', value: 'Tilla, Dori and Threadwork' }
    ],
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-pw-4',
    name: 'Sana Safinaz Muzlin Festive 3-Piece',
    category: "Elegant Women's Wear",
    subcategory: 'Original Pakistani Lawn',
    price: 8900,
    description: 'Contemporary original Pakistani silhouette with digital printed lawn, resham threadwork, and printed woven net dupatta.',
    details: 'Original Pakistani designer daily luxury wear. Breathable high-density lawn shirt with resham floral embroidery, woven net dupatta with printed borders, and tailored cotton trousers.',
    specs: [
      { label: 'Origin', value: '100% Original Pakistani Import' },
      { label: 'Shirt Fabric', value: 'Digital Printed Slub Lawn' },
      { label: 'Dupatta', value: 'Printed Woven Net' },
      { label: 'Trouser', value: 'Dyed Cotton' },
      { label: 'Type', value: 'Unstitched 3-Piece' }
    ],
    image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  },

  // 2. Home Decor (Bedsheets & Comforters)
  {
    id: 'prod-hd-1',
    name: '1000 TC Egyptian Cotton King Bedsheet Set',
    category: 'Home Decor',
    subcategory: 'Bedsheets',
    price: 7500,
    description: 'Ultra-luxurious 1000 thread count sateen weave sheet set with deep pocket fitted sheet, flat sheet, and 2 pillowcases.',
    details: 'Woven from 100% certified long-staple Egyptian cotton. Silky smooth sateen finish with high breathability and anti-pilling durability. Fits king mattresses up to 16 inches deep.',
    specs: [
      { label: 'Material', value: '100% Long-Staple Egyptian Cotton' },
      { label: 'Thread Count', value: '1000 TC Sateen Weave' },
      { label: 'Set Includes', value: '1 Flat Sheet, 1 Fitted Sheet, 2 Pillowcases' },
      { label: 'Bed Size', value: 'King (7.5 ft x 8 ft)' },
      { label: 'Care', value: 'Machine Washable at 40°C' }
    ],
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    featured: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-hd-2',
    name: 'Royal Velvet Quilted Winter Comforter Set',
    category: 'Home Decor',
    subcategory: 'Comforters',
    price: 11500,
    description: 'Plush velvet quilted king comforter filled with 400 GSM microfiber down alternative, including 2 pillow shams.',
    details: 'Opulent winter warmth. Features diamond stitch quilting on crushed micro-velvet with a soft brushed cotton underside for breathable sleeping comfort. Hypoallergenic and lightweight yet thermal.',
    specs: [
      { label: 'Top Fabric', value: 'Premium Crushed Micro-Velvet' },
      { label: 'Reverse Fabric', value: '100% Brushed Cotton' },
      { label: 'Filling', value: '400 GSM Microfiber Down Alternative' },
      { label: 'Dimensions', value: 'King (90 x 100 Inches)' },
      { label: 'Set Includes', value: '1 King Comforter, 2 Pillow Shams' }
    ],
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    featured: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-hd-3',
    name: 'Hotel Satin Stripe Luxury Bedsheet Set',
    category: 'Home Decor',
    subcategory: 'Bedsheets',
    price: 6200,
    description: 'Classic 1cm damask satin stripe sheets crafted from 100% combed cotton with cool, crisp hotel-grade comfort.',
    details: 'Engineered for luxury hospitality comfort. 600 thread count combed cotton provides crisp softness and temperature regulation for year-round restful sleep.',
    specs: [
      { label: 'Material', value: '100% Combed Cotton' },
      { label: 'Pattern', value: '1cm Damask Satin Stripe' },
      { label: 'Thread Count', value: '600 TC Hotel Grade' },
      { label: 'Set Includes', value: '1 Flat Sheet (100x108 in), 2 Pillow Covers' },
      { label: 'Finish', value: 'Mercerized Lustre Finish' }
    ],
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  },
  {
    id: 'prod-hd-4',
    name: 'All-Season Sateen Cloud Comforter',
    category: 'Home Decor',
    subcategory: 'Comforters',
    price: 9500,
    description: 'Box-stitched lightweight comforter with silky 300 TC cotton sateen shell and cloud-soft microfiber loft.',
    details: 'Designed for moderate and air-conditioned bedrooms. Baffle box construction keeps fill evenly distributed without shifting or clumping. Machine washable on gentle cycle.',
    specs: [
      { label: 'Outer Shell', value: '100% Cotton Sateen (300 TC)' },
      { label: 'Filling', value: '300 GSM Virgin Hollowfiber' },
      { label: 'Construction', value: 'End-to-End Baffle Box Stitching' },
      { label: 'Size', value: 'Queen / King (88 x 96 Inches)' },
      { label: 'Hypoallergenic', value: 'Yes, Dust-Mite Resistant' }
    ],
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  }
];
