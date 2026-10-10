import { Product } from '../types';

export const PRODUCTS: Product[] = [
  // 1. Elegant Women's Wear
  {
    id: 'prod-pw-1',
    name: 'Baroque Luxury Embroidered Chiffon 3-Piece',
    category: "Elegant Women's Wear",
    subcategory: 'Luxury Chiffon',
    price: 13500,
    description: '3-piece luxury unstitched suit featuring hand-embellished zari and sequin embroidery.',
    details: 'Complete 3-piece designer suit. Embroidered chiffon front and back, hand-embellished neckline patch, embroidered chiffon sleeves, digital printed silk dupatta, and dyed raw silk trousers.',
    specs: [
      { label: 'Fabric', value: 'Pure Chiffon with Raw Silk Trouser' },
      { label: 'Colour', value: 'Emerald & Gold' },
      { label: 'Size', value: 'Unstitched 3-Piece' }
    ],
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=95',
      'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: true,
    rating: 5,
    reviewsCount: 12
  },
  {
    id: 'prod-pw-2',
    name: 'Maria.B M.Prints Luxury Lawn 3-Piece',
    category: "Elegant Women's Wear",
    subcategory: 'Other',
    price: 9800,
    description: 'Pakistani combed lawn with intricate schiffli embroidered front, printed chiffon dupatta, and cambric trousers.',
    details: 'Designer lawn collection. Includes embroidered neckline patch, printed fine lawn front and back, organza embroidered sleeve borders, chiffon dupatta, and cotton dyed trousers.',
    specs: [
      { label: 'Fabric', value: 'Combed Lawn with Chiffon Dupatta' },
      { label: 'Colour', value: 'Powder Blue & White' },
      { label: 'Size', value: 'Unstitched 3-Piece' }
    ],
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: true,
    rating: 4.8,
    reviewsCount: 8
  },
  {
    id: 'prod-pw-3',
    name: 'Asim Jofa Festive Embroidered Organza Suit',
    category: "Elegant Women's Wear",
    subcategory: 'Festive Embroidered',
    price: 15500,
    description: 'Festive couture piece crafted on pure organza with tilla work and crushed silk dupatta.',
    details: 'Formal festive dress. Fully embroidered organza kalis, embellished bodice, embroidered organza border for front and back daman, embroidered organza dupatta, and silk slip and trousers.',
    specs: [
      { label: 'Fabric', value: 'Pure Organza & Silk' },
      { label: 'Colour', value: 'Rose Blush' },
      { label: 'Size', value: 'Unstitched 3-Piece' }
    ],
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: false,
    rating: 5,
    reviewsCount: 4
  },
  {
    id: 'prod-pw-4',
    name: 'Sana Safinaz Muzlin Festive 3-Piece',
    category: "Elegant Women's Wear",
    subcategory: 'Other',
    price: 8900,
    description: 'Contemporary silhouette with digital printed lawn, resham threadwork, and printed woven net dupatta.',
    details: 'Designer luxury wear. Breathable high-density lawn shirt with resham floral embroidery, woven net dupatta with printed borders, and tailored cotton trousers.',
    specs: [
      { label: 'Fabric', value: 'Slub Lawn & Woven Net' },
      { label: 'Colour', value: 'Peach & Sage' },
      { label: 'Size', value: 'Unstitched 3-Piece' }
    ],
    image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: false,
    rating: 4.9,
    reviewsCount: 7
  },

  // 2. Home Decor
  {
    id: 'prod-hd-1',
    name: '1000 TC Egyptian Cotton King Bedsheet Set',
    category: 'Home Decor',
    subcategory: 'Bedsheets',
    price: 7500,
    description: '1000 thread count sateen weave sheet set with deep pocket fitted sheet, flat sheet, and 2 pillowcases.',
    details: 'Woven from 100% long-staple Egyptian cotton. Silky smooth sateen finish with high breathability and anti-pilling durability. Fits king mattresses up to 16 inches deep.',
    specs: [
      { label: 'Colour', value: 'Ivory Cream' },
      { label: 'Size', value: 'King (7.5 ft x 8 ft)' }
    ],
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1800&q=95',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: true,
    rating: 5,
    reviewsCount: 15
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
      { label: 'Colour', value: 'Burgundy Velvet' },
      { label: 'Size', value: 'King (90 x 100 Inches)' }
    ],
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: true,
    rating: 5,
    reviewsCount: 9
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
      { label: 'Colour', value: 'Crisp White' },
      { label: 'Size', value: 'King (100 x 108 Inches)' }
    ],
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: false,
    rating: 4.8,
    reviewsCount: 6
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
      { label: 'Colour', value: 'Pearl Grey' },
      { label: 'Size', value: 'Queen / King (88 x 96 Inches)' }
    ],
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1800&q=95',
    additionalImages: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=95'
    ],
    inStock: true,
    featured: false,
    rating: 4.7,
    reviewsCount: 3
  }
];
