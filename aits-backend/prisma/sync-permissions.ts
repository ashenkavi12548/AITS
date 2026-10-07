import { PrismaClient, RoleName } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Starting permission synchronization...');

  // 1. Ensure Roles exist
  const roles = await prisma.role.findMany();
  const createdRoles = roles.reduce(
    (acc, r) => {
      acc[r.name] = r.id;
      return acc;
    },
    {} as Record<string, string>,
  );

  // 2. Ensure Permissions exist
  const permissions = await prisma.permission.findMany();
  const createdPermissions = permissions.reduce(
    (acc, p) => {
      acc[p.name] = p.id;
      return acc;
    },
    {} as Record<string, string>,
  );

  if (
    !createdRoles[RoleName.FARMER] ||
    Object.keys(createdPermissions).length === 0
  ) {
    console.error('❌ Database not seeded! Run the initial seed script first.');
    process.exit(1);
  }

  // 3. Define the role-permission map
  const rolePermissionsMap: Record<string, string[]> = {
    [RoleName.FARMER]: Object.keys(createdPermissions), // All permissions
    
    
    
  };

  let syncedCount = 0;

  for (const [roleName, perms] of Object.entries(rolePermissionsMap)) {
    const roleId = createdRoles[roleName];
    if (!roleId) {
      console.warn(`⚠️ Role ${roleName} not found in database. Skipping...`);
      continue;
    }

    console.log(`Synchronizing permissions for ${roleName}...`);

    for (const permName of perms) {
      const permId = createdPermissions[permName];
      if (!permId) {
        console.warn(
          `⚠️ Permission ${permName} not found in database. Skipping...`,
        );
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId: permId,
        },
      });
      syncedCount++;
    }
  }

  console.log(
    `✅ Synchronization complete. Verified/Updated ${syncedCount} role-permission mappings.`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
