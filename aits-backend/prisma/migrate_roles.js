const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting role migration...');

  // 1. Create new roles
  const newRoles = ['MANAGER', 'VETERINARIAN', 'WORKER'];
  const roleIds = {};

  for (const roleName of newRoles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Migrated ${roleName} role`,
      }
    });
    roleIds[roleName] = role.id;
  }
  
  // Also get the ADMIN and FARMER roles just in case
  const existingRoles = await prisma.role.findMany();
  for (const r of existingRoles) {
    roleIds[r.name] = r.id;
  }

  console.log('Role IDs mapping ready.');

  // 2. Find all userRoles
  const userRoles = await prisma.userRole.findMany({ include: { role: true } });

  let migratedCount = 0;
  for (const ur of userRoles) {
    let targetRoleName = null;
    
    switch(ur.role.name) {
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
      console.log(`Migrating user ${ur.userId} from ${ur.role.name} to ${targetRoleName}...`);
      await prisma.userRole.update({
        where: { id: ur.id },
        data: { roleId: roleIds[targetRoleName] }
      });
      
      // Update primary role in user table if needed
      await prisma.user.update({
         where: { id: ur.userId },
         data: { primaryRole: targetRoleName }
      });
      migratedCount++;
    }
  }

  console.log(`Migrated ${migratedCount} user role mappings.`);
  
  // 3. Delete old roles
  const deprecatedRoles = [
    'FARM_WORKER', 'VETERINARY_OFFICER', 'AI_TECHNICIAN', 
    'GOVERNMENT_OFFICER', 'BANK_OFFICER', 'INSURANCE_OFFICER'
  ];
  
  for (const roleName of deprecatedRoles) {
    if (roleIds[roleName]) {
      console.log(`Deleting deprecated role: ${roleName}`);
      // Wait, what if there are dangling permissions for this role?
      // Prisma handles cascading deletes if configured, but let's delete RolePermission first
      await prisma.rolePermission.deleteMany({
        where: { roleId: roleIds[roleName] }
      });
      await prisma.role.delete({
        where: { id: roleIds[roleName] }
      });
    }
  }
  
  console.log('Migration complete.');
}

migrate()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
