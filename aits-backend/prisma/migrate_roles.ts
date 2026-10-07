import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log('Starting role migration...');

  // 1. Create new roles
  const newRoles = ['MANAGER', 'VETERINARIAN', 'WORKER'];
  const roleIds: Record<string, string> = {};

  for (const roleName of newRoles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Migrated ${roleName} role`,
      },
    });
    roleIds[roleName] = role.id;
  }

  const existingRoles = await prisma.role.findMany();
  for (const r of existingRoles) {
    roleIds[r.name] = r.id;
  }

  console.log('Role IDs mapping ready.');

  // 2. Find all userRoles
  const userRoles = await prisma.userRole.findMany({
    include: {
      role: true,
      user: { include: { ownedFarms: true, farmMemberships: true } },
    },
  });

  let migratedCount = 0;
  for (const ur of userRoles) {
    let targetRoleName: string | null = null;

    switch (ur.role.name) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        if (ur.user.ownedFarms.length > 0) {
          targetRoleName = 'FARMER';
          console.log(
            `[Migration] Admin ${ur.user.email} owns farms. Migrating to FARMER.`,
          );
        } else if (ur.user.farmMemberships.length > 0) {
          targetRoleName = 'MANAGER';
          console.log(
            `[Migration] Admin ${ur.user.email} has memberships but no owned farms. Migrating to MANAGER.`,
          );
        } else {
          targetRoleName = 'WORKER';
          console.warn(
            `[MANUAL RESOLUTION REQUIRED] User ${ur.user.email} was ${ur.role.name} but has no farms. Demoted to WORKER.`,
          );
        }
        break;
      case 'FARM_WORKER':
        targetRoleName = 'WORKER';
        break;
      case 'VETERINARY_OFFICER':
        targetRoleName = 'VETERINARIAN';
        break;
      case 'AI_TECHNICIAN':
      case 'GOVERNMENT_OFFICER':
      case 'BANK_OFFICER':
      case 'INSURANCE_OFFICER':
        targetRoleName = 'WORKER';
        break;
    }

    if (targetRoleName) {
      console.log(
        `Migrating user ${ur.userId} from ${ur.role.name} to ${targetRoleName}...`,
      );
      await prisma.userRole.update({
        where: { id: ur.id },
        data: { roleId: roleIds[targetRoleName] },
      });
      migratedCount++;
    }
  }

  console.log(`Migrated ${migratedCount} user role mappings.`);

  // 3. Delete old roles
  const deprecatedRoles = [
    'ADMIN',
    'SUPER_ADMIN',
    'FARM_WORKER',
    'VETERINARY_OFFICER',
    'AI_TECHNICIAN',
    'GOVERNMENT_OFFICER',
    'BANK_OFFICER',
    'INSURANCE_OFFICER',
  ];

  for (const roleName of deprecatedRoles) {
    if (roleIds[roleName]) {
      console.log(`Deleting deprecated role: ${roleName}`);
      await prisma.rolePermission.deleteMany({
        where: { roleId: roleIds[roleName] },
      });
      await prisma.role.delete({
        where: { id: roleIds[roleName] },
      });
    }
  }

  console.log('Migration complete.');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
