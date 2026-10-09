import {
  PrismaClient,
  AnimalGender,
  AnimalStatus,
  MilkingSession,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting cow data and milk production seed for backend...');

  // 1. Resolve or create primary farm owner / user for recording records
  let recordedByUser =
    (await prisma.user.findFirst({
      where: { email: 'farmer.owner@aits.lk', deletedAt: null },
    })) ||
    (await prisma.user.findFirst({
      where: { email: 'admin@aits.gov', deletedAt: null },
    })) ||
    (await prisma.user.findFirst({ where: { deletedAt: null } }));

  if (!recordedByUser) {
    console.log('No user found. Creating default farm manager user...');
    recordedByUser = await prisma.user.create({
      data: {
        email: 'farmer.owner@aits.lk',
        firstName: 'Sunil',
        lastName: 'Bandara',
        phone: '+94771234567',
        passwordHash:
          '$2b$10$epR3Vf.tSgM8z9mIHzXf8e2u2pZ7oI1fI4F2o1/6f.1h4R2y5w5e.', // Placeholder hash
        status: 'ACTIVE',
      },
    });
  }

  // 2. Resolve or create Highland Dairy Farm
  let farm = await prisma.farm.findFirst({
    where: { registrationNumber: 'FARM-HLD-001', deletedAt: null },
  });

  if (!farm) {
    console.log('Creating primary dairy farm facility...');
    farm = await prisma.farm.create({
      data: {
        name: 'Highland Dairy Farm',
        registrationNumber: 'FARM-HLD-001',
        ownerId: recordedByUser.id,
        address: '45 Nuwara Eliya Road',
        city: 'Nuwara Eliya',
        district: 'Nuwara Eliya',
        province: 'Central Province',
        farmType: 'Commercial Dairy',
        contactNumber: '+94522223344',
        status: 'ACTIVE',
      },
    });
  }

  // 3. Define and upsert Dairy Cows (female cattle for milk production)
  const cowDefs = [
    {
      tag: 'TAG-0019',
      name: 'Malini',
      breed: 'Jersey',
      dob: '2021-04-12',
      weight: 420,
      baseYield: 15.5,
    },
    {
      tag: 'TAG-0041',
      name: 'Kumari',
      breed: 'Friesian',
      dob: '2022-01-15',
      weight: 510,
      baseYield: 18.2,
    },
    {
      tag: 'TAG-0033',
      name: 'Sundari',
      breed: 'Sahiwal',
      dob: '2020-08-20',
      weight: 460,
      baseYield: 13.8,
    },
    {
      tag: 'TAG-0057',
      name: 'Ranjani',
      breed: 'Friesian Cross',
      dob: '2022-06-10',
      weight: 480,
      baseYield: 16.4,
    },
    {
      tag: 'TAG-0028',
      name: 'Kamala',
      breed: 'Jersey',
      dob: '2021-09-03',
      weight: 430,
      baseYield: 14.9,
    },
    {
      tag: 'TAG-0072',
      name: 'Pavani',
      breed: 'Sahiwal Cross',
      dob: '2023-02-14',
      weight: 390,
      baseYield: 12.5,
    },
    {
      tag: 'TAG-0014',
      name: 'Nanda',
      breed: 'Friesian',
      dob: '2020-11-28',
      weight: 530,
      baseYield: 17.6,
    },
    {
      tag: 'TAG-0067',
      name: 'Priya',
      breed: 'Friesian',
      dob: '2022-03-05',
      weight: 495,
      baseYield: 16.8,
    },
  ];

  console.log(`Upserting ${cowDefs.length} dairy cows...`);
  const cows: Array<{
    id: string;
    animalNumber: string;
    farmId: string;
    baseYield: number;
  }> = [];

  for (const c of cowDefs) {
    const cow = await prisma.animal.upsert({
      where: { animalNumber: c.tag },
      update: {
        name: c.name,
        breed: c.breed,
        species: 'Cattle',
        gender: AnimalGender.FEMALE,
        dateOfBirth: new Date(c.dob),
        weight: c.weight,
        status: AnimalStatus.ACTIVE,
        farmId: farm.id,
      },
      create: {
        farmId: farm.id,
        animalNumber: c.tag,
        name: c.name,
        breed: c.breed,
        species: 'Cattle',
        gender: AnimalGender.FEMALE,
        dateOfBirth: new Date(c.dob),
        weight: c.weight,
        status: AnimalStatus.ACTIVE,
      },
    });

    cows.push({
      id: cow.id,
      animalNumber: cow.animalNumber,
      farmId: cow.farmId,
      baseYield: c.baseYield,
    });
  }
  console.log(`✅ ${cows.length} dairy cows ready for production.`);

  // 4. Seed realistic milk production records for past 5 days (Day 4 to Day 0/today)
  console.log('Seeding milk production records for each dairy cow...');
  let recordCount = 0;

  for (let dayOffset = 4; dayOffset >= 0; dayOffset--) {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    const prodDate = new Date(`${dateStr}T12:00:00.000Z`);

    for (const cow of cows) {
      // Deterministic realistic variance
      const dayVariation =
        ((dayOffset * 7 +
          cow.animalNumber.charCodeAt(cow.animalNumber.length - 1)) %
          5) *
          0.3 -
        0.6;
      const morningLiters = Number(
        Math.max(5.0, cow.baseYield * 0.58 + dayVariation).toFixed(1),
      );
      const eveningLiters = Number(
        Math.max(4.0, cow.baseYield * 0.42 + dayVariation * 0.8).toFixed(1),
      );

      // Morning milking session
      try {
        await prisma.milkProduction.upsert({
          where: {
            animalId_productionDate_milkingSession: {
              animalId: cow.id,
              productionDate: prodDate,
              milkingSession: MilkingSession.MORNING,
            },
          },
          update: {
            quantityLiters: morningLiters,
            milkQuality: 'ACCEPTED',
          },
          create: {
            animalId: cow.id,
            farmId: cow.farmId,
            recordedById: recordedByUser.id,
            productionDate: prodDate,
            milkingSession: MilkingSession.MORNING,
            quantityLiters: morningLiters,
            milkQuality: 'ACCEPTED',
            fatPercentage: Number((3.8 + (dayOffset % 3) * 0.15).toFixed(2)),
            proteinPercentage: Number((3.2 + (dayOffset % 2) * 0.1).toFixed(2)),
            notes:
              'Normal morning collection yield. Somatic cell count optimal.',
          },
        });
        recordCount++;
      } catch {
        // Skip duplicate or constraint error if any
      }

      // Evening milking session
      try {
        await prisma.milkProduction.upsert({
          where: {
            animalId_productionDate_milkingSession: {
              animalId: cow.id,
              productionDate: prodDate,
              milkingSession: MilkingSession.EVENING,
            },
          },
          update: {
            quantityLiters: eveningLiters,
            milkQuality: 'ACCEPTED',
          },
          create: {
            animalId: cow.id,
            farmId: cow.farmId,
            recordedById: recordedByUser.id,
            productionDate: prodDate,
            milkingSession: MilkingSession.EVENING,
            quantityLiters: eveningLiters,
            milkQuality: 'ACCEPTED',
            fatPercentage: Number((4.0 + (dayOffset % 3) * 0.12).toFixed(2)),
            proteinPercentage: Number((3.3 + (dayOffset % 2) * 0.1).toFixed(2)),
            notes: 'Evening milking completed smoothly without issues.',
          },
        });
        recordCount++;
      } catch {
        // Skip duplicate or constraint error if any
      }
    }
  }

  console.log(
    `✅ Seeded ${recordCount} milk production records across ${cows.length} cows!`,
  );
  console.log('🌱 Cow data and milk production seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
