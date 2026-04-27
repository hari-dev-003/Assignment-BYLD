import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });


async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully.');
  } catch (e) {
    console.error('Database connection failed:', e);
  }
}

testConnection();

export default prisma;