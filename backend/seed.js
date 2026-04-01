const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const dummyProducts = [
  {
    id: 'p_shoes_1',
    name: 'Nike Air Max 270',
    price: 'Rs 14,999',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'shoes',
    description: 'Iconic Nike Air Max styling with incredible comfort and large air unit.',
    metaTitle: 'Buy Nike Air Max 270',
    metaDescription: 'Best price for Nike Air Max 270 shoes in Pakistan.',
    keywords: 'nike, shoes, sneakers, air max',
    slug: 'nike-air-max-270'
  },
  {
    id: 'p_shoes_2',
    name: 'Adidas Ultraboost',
    price: 'Rs 18,500',
    badge: 'Sale',
    image: 'https://images.unsplash.com/photo-1588099767228-56b9c9f37c35?auto=format&fit=crop&w=800&q=80',
    category: 'shoes',
    description: 'Responsive boost midsole and snug Primeknit upper.',
    metaTitle: 'Adidas Ultraboost Running Shoes',
    metaDescription: 'Shop Adidas Ultraboost online.',
    keywords: 'adidas, running, shoes, ultraboost',
    slug: 'adidas-ultraboost'
  },
  {
    id: 'p_shoes_3',
    name: 'Puma RS-X Casual',
    price: 'Rs 12,000',
    badge: '',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
    category: 'shoes',
    description: 'Retro futuristic design with Puma RS cushioning.',
    metaTitle: 'Puma RS-X',
    metaDescription: 'Puma casual shoes for everyday wear.',
    keywords: 'puma, casual, sneakers, fashion',
    slug: 'puma-rs-x'
  },
  {
    id: 'p_cloth_1',
    name: 'Premium Cotton Plain T-Shirt',
    price: 'Rs 1,299',
    badge: 'Basic',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    category: 'clothing',
    description: '100% pure cotton, highly breathable and soft plain t-shirt.',
    metaTitle: 'Plain Cotton T-Shirt',
    metaDescription: 'Buy pure cotton t-shirts.',
    keywords: 'tshirt, cotton, plain, clothing',
    slug: 'premium-cotton-tshirt'
  },
  {
    id: 'p_cloth_2',
    name: 'Vintage Oversized Hoodie',
    price: 'Rs 3,499',
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
    category: 'clothing',
    description: 'Thick, warm, and cozy oversized hoodie for winter.',
    metaTitle: 'Oversized Winter Hoodie',
    metaDescription: 'Shop vintage hoodies.',
    keywords: 'hoodie, winter, jacket, vintage',
    slug: 'vintage-oversized-hoodie'
  },
  {
    id: 'p_cloth_3',
    name: 'Denim Classic Jacket',
    price: 'Rs 4,999',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80',
    category: 'clothing',
    description: 'Classic fit blue denim jacket perfect for layering.',
    metaTitle: 'Denim Men Jacket',
    metaDescription: 'Best denim jacket in town.',
    keywords: 'denim, jacket, blue, fashion',
    slug: 'denim-classic-jacket'
  },
  {
    id: 'p_perfume_1',
    name: 'Bleu de Chanel 100ml',
    price: 'Rs 22,000',
    badge: 'Luxury',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
    category: 'perfumes',
    description: 'A woody aromatic fragrance for the man who defies convention.',
    metaTitle: 'Bleu de Chanel Perfume',
    metaDescription: 'Buy original Bleu de Chanel.',
    keywords: 'perfume, chanel, luxury, fragrance',
    slug: 'bleu-de-chanel'
  },
  {
    id: 'p_perfume_2',
    name: 'Dior Sauvage For Men',
    price: 'Rs 28,500',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=80',
    category: 'perfumes',
    description: 'A radically fresh composition, raw and noble all at once.',
    metaTitle: 'Dior Sauvage EDP',
    metaDescription: 'Shop Dior Sauvage online.',
    keywords: 'dior, sauvage, men perfume',
    slug: 'dior-sauvage'
  },
  {
    id: 'p_acc_1',
    name: 'Minimalist Leather Wallet',
    price: 'Rs 1,800',
    badge: '',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    category: 'accessories',
    description: 'Slim leather wallet with RFID protection.',
    metaTitle: 'Leather Wallet Slim',
    metaDescription: 'RFID blocked slim leather wallet.',
    keywords: 'wallet, leather, accessories, slim',
    slug: 'minimalist-leather-wallet'
  },
  {
    id: 'p_acc_2',
    name: 'Casio Vintage Digital Watch',
    price: 'Rs 6,500',
    badge: 'Classic',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80',
    category: 'accessories',
    description: 'Classic silver tone stainless steel digital watch.',
    metaTitle: 'Casio Vintage Watch',
    metaDescription: 'Buy original Casio watches.',
    keywords: 'casio, watch, vintage, silver',
    slug: 'casio-vintage-watch'
  },
  {
    id: 'p_bag_1',
    name: 'Canvas Travel Duffle Bag',
    price: 'Rs 4,200',
    badge: 'Sale',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    category: 'bags',
    description: 'Spacious canvas duffle bag ideal for weekend trips.',
    metaTitle: 'Travel Duffle Bag',
    metaDescription: 'Large travel bag for weekends.',
    keywords: 'bag, duffle, travel, canvas',
    slug: 'canvas-travel-bag'
  },
  {
    id: 'p_bag_2',
    name: 'Premium Leather Ladies Handbag',
    price: 'Rs 7,800',
    badge: 'Featured',
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=800&q=80',
    category: 'bags',
    description: 'Elegant leather handbag with gold accents.',
    metaTitle: 'Leather Handbag',
    metaDescription: 'Shop premium ladies bags.',
    keywords: 'handbag, ladies, leather, fashion',
    slug: 'leather-ladies-handbag'
  },
  {
    id: 'p_cover_1',
    name: 'iPhone 15 Pro Max Silicone Case',
    price: 'Rs 999',
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1603539947678-cd3954ed515d?auto=format&fit=crop&w=800&q=80',
    category: 'phone-covers',
    description: 'Soft silicon case with microfibre lining for iPhone 15 Pro Max.',
    metaTitle: 'iPhone 15 Case',
    metaDescription: 'Silicone cover for Apple iPhone.',
    keywords: 'iphone, cover, case, silicone',
    slug: 'iphone-15-pro-max-silicone-case'
  },
  {
    id: 'p_cover_2',
    name: 'Samsung S24 Ultra Clear Case',
    price: 'Rs 1,200',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79201af3?auto=format&fit=crop&w=800&q=80',
    category: 'phone-covers',
    description: 'Anti-yellowing clear protective case to show off your phone.',
    metaTitle: 'Samsung S24 Ultra Cover',
    metaDescription: 'Clear shockproof case for S24.',
    keywords: 'samsung, s24 ultra, clear case',
    slug: 'samsung-s24-ultra-clear-case'
  },
  {
    id: 'p_cover_3',
    name: 'Rugged Armor Armor Case',
    price: 'Rs 1,500',
    badge: '',
    image: 'https://images.unsplash.com/photo-1541344999736-83eca2728464?auto=format&fit=crop&w=800&q=80',
    category: 'phone-covers',
    description: 'Heavy duty drop-tested armor phone case.',
    metaTitle: 'Rugged Armor Phone Case',
    metaDescription: 'Tough phone covers.',
    keywords: 'armor cover, heavy duty, rugged',
    slug: 'rugged-armor-case'
  },
  {
    id: 'p_elec_1',
    name: 'Sony WH-1000XM5 Headphones',
    price: 'Rs 85,000',
    badge: 'Premium',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
    category: 'electronics',
    description: 'Industry leading noise cancellation wireless headphones.',
    metaTitle: 'Sony WH-1000XM5',
    metaDescription: 'Buy Sony wireless headphones.',
    keywords: 'sony, headphones, anc, wireless',
    slug: 'sony-wh1000xm5'
  },
  {
    id: 'p_elec_2',
    name: 'Apple AirPods Pro 2',
    price: 'Rs 65,000',
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
    category: 'electronics',
    description: 'Immersive sound with active noise cancelation.',
    metaTitle: 'Apple AirPods Pro 2',
    metaDescription: 'Shop original AirPods.',
    keywords: 'apple, airpods, pro, earbuds',
    slug: 'apple-airpods-pro-2'
  },
  {
    id: 'p_elec_3',
    name: 'Logitech MX Master 3S Mouse',
    price: 'Rs 25,000',
    badge: '',
    image: 'https://images.unsplash.com/photo-1527864551497-11367ce890e2?auto=format&fit=crop&w=800&q=80',
    category: 'electronics',
    description: 'Advanced wireless mouse for creatives and coders.',
    metaTitle: 'Logitech MX Master 3S',
    metaDescription: 'Best productivity mouse.',
    keywords: 'logitech, mouse, wireless, productivity',
    slug: 'logitech-mx-master-3s'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    console.log('MongoDB Connected. Clearing old products...');
    await Product.deleteMany({});
    
    console.log('Inserting mock products...');
    await Product.insertMany(dummyProducts);
    
    console.log('Database Seeding Completed Successfully! You can close this script.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seedDB();
