import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const latestFarm = await prisma.farm.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      users: true,
      owner: true,
    },
  });

  if (latestFarm) {
    console.log('Latest Farm:', {
      id: latestFarm.id,
      name: latestFarm.name,
      ownerId: latestFarm.ownerId,
      ownerEmail: latestFarm.owner.email,
    });
    console.log(
      'Farm Users:',
      latestFarm.users.map((u) => ({
        userId: u.userId,
        role: u.role,
        status: u.status,
      })),
    );
  } else {
    console.log('No farms found.');
  }

  const latestUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      userRoles: { include: { role: true } },
    },
  });
  console.log(
    'Latest Users:',
    latestUsers.map((u) => ({
      email: u.email,
      id: u.id,
      roles: u.userRoles.map((ur) => ur.role.name),
    })),
  );
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
