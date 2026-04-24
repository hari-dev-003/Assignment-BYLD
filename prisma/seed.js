import "dotenv/config";
import prisma from "../src/config/db.js";

const companies = [
  // STOCKS
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', category: 'STOCK', price: 2950.45 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', category: 'STOCK', price: 3820.15 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', category: 'STOCK', price: 1530.60 },
  { symbol: 'INFY', name: 'Infosys Ltd', category: 'STOCK', price: 1420.00 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', category: 'STOCK', price: 1080.35 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', category: 'STOCK', price: 3600.90 },
  
  // ETFs
  { symbol: 'NIFTYBEES', name: 'Nippon India ETF Nifty 50 BeES', category: 'ETF', price: 245.12 },
  { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', category: 'ETF', price: 62.45 },
  { symbol: 'BANKBEES', name: 'Nippon India ETF Bank BeES', category: 'ETF', price: 510.30 },
  { symbol: 'MON100', name: 'Motilal Oswal Nasdaq 100 ETF', category: 'ETF', price: 145.75 },
  { symbol: 'ITBEES', name: 'Nippon India ETF IT BeES', category: 'ETF', price: 38.20 },

  // BONDS
  { symbol: 'GS2033', name: '7.18% Government Security 2033', category: 'BOND', price: 100.25 },
  { symbol: 'NHAI_TX', name: 'NHAI Tax Free Bonds', category: 'BOND', price: 1150.00 },
  { symbol: 'RECL_B', name: 'REC Limited Corporate Bond', category: 'BOND', price: 1005.50 },
  { symbol: 'NABARD_B', name: 'NABARD Rural Bond', category: 'BOND', price: 5000.00 },

  // MTFs (Margin Trading Facility - often represented by high-volume blue chips)
  { symbol: 'SBIN_M', name: 'State Bank of India (MTF Enabled)', category: 'MTF', price: 770.40 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd (MTF)', category: 'MTF', price: 1285.00 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises (MTF)', category: 'MTF', price: 3120.65 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd (MTF)', category: 'MTF', price: 165.25 },
  { symbol: 'ITC', name: 'ITC Ltd (MTF)', category: 'MTF', price: 430.10 }
];

async function main() {
  console.log('🌱 Starting Seeding...');

  for (const company of companies) {
    await prisma.company.upsert({
      where: { symbol: company.symbol },
      update: { 
        price: company.price,
        name: company.name,
        category: company.category 
      },
      create: company,
    });
  }

  console.log(`✅ Successfully seeded ${companies.length} companies.`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });