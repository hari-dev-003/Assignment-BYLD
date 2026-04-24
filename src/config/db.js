import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();


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