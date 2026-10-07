/**
 * SECURITY WARNING:
 * This seed script is for DEVELOPMENT & STAGING environments ONLY.
 * NEVER execute this script against a live production database with default credentials.
 * Production admin accounts must be created securely via production onboarding scripts.
 */

import {
  PrismaClient,
  Prisma,
  RoleName,
  UserStatus,
  AnimalStatus,
  AnimalGender,
  MilkingSession,
  User,
  Animal,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. System Roles
  const roles: Array<{ name: RoleName; description: string }> = [
    {
      name: 'MANAGER',
      description: 'Farm manager overseeing operations',
    },
    {
      name: 'FARMER',
      description: 'Farm owner managing farm and animal records',
    },
    {
      name: 'WORKER',
      description: 'Farm worker managing operational daily tasks',
    },
    {
      name: 'VETERINARIAN',
      description:
        'Licensed veterinarian managing health, vaccinations, and visits',
    },
  ];

  const createdRoles: Record<string, string> = {};

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: {
        name: r.name,
        description: r.description,
      },
    });
    createdRoles[r.name] = role.id;
  }
  console.log('✅ System roles seeded');

  // 2. Default Permissions
  const permissionsList = [
    // User & Role management
    { name: 'user:create', description: 'Create user accounts' },
    { name: 'user:read', description: 'View user details' },
    { name: 'user:update', description: 'Update user accounts' },
    { name: 'user:delete', description: 'Delete or suspend users' },
    { name: 'role:manage', description: 'Manage roles and permissions' },

    // Farm management
    { name: 'farm:create', description: 'Register new farm' },
    { name: 'farm:read', description: 'View farm details' },
    { name: 'farm:update', description: 'Update farm details' },
    { name: 'farm:delete', description: 'Delete farm profile' },

    // Animal management
    { name: 'animal:create', description: 'Register new animal' },
    { name: 'animal:read', description: 'View animal profiles and genealogy' },
    { name: 'animal:update', description: 'Update animal information' },
    { name: 'animal:delete', description: 'Remove animal record' },

    // Health & Vaccination
    { name: 'health:read', description: 'View health records and diagnoses' },
    { name: 'health:record', description: 'Create and edit health records' },
    {
      name: 'vaccination:record',
      description: 'Administer and log vaccinations',
    },
    {
      name: 'treatment:manage',
      description: 'Prescribe and administer treatments',
    },
    { name: 'veterinary:visit', description: 'Log veterinary clinic visits' },

    // Production & Feeding
    { name: 'milk:read', description: 'View milk production records' },
    { name: 'milk:record', description: 'Log milk production yields' },
    {
      name: 'milk:update',
      description: 'Update or void milk production records',
    },
    { name: 'milk:delete', description: 'Soft delete milk production records' },
    {
      name: 'milk:delete-permanent',
      description: 'Permanently delete milk production records',
    },
    {
      name: 'feeding:record',
      description: 'Log feeding schedules and feed types',
    },

    // Breeding & Reproduction
    { name: 'breeding:record', description: 'Log breeding activities and AI' },
    {
      name: 'pregnancy:track',
      description: 'Track animal pregnancy and expected calving',
    },

    // Movement & Ownership
    {
      name: 'movement:record',
      description: 'Initiate and log animal transport/movement',
    },
    {
      name: 'ownership:transfer',
      description: 'Transfer animal ownership between users',
    },

    // Document & Offline Sync
    {
      name: 'document:manage',
      description: 'Upload and manage official documents',
    },
    {
      name: 'sync:execute',
      description: 'Perform offline data synchronization',
    },

    // Audit & System
    { name: 'audit:view', description: 'View system audit logs' },
    { name: 'system:settings', description: 'Modify global system settings' },

    // Visibility & UI Access
    {
      name: 'dashboard:view',
      description: 'Access and view the main dashboard',
    },
    { name: 'reports:read', description: 'Access and generate system reports' },
    {
      name: 'traceability:read',
      description: 'View animal traceability history',
    },
    { name: 'calendar:read', description: 'View farm schedule and calendar' },
    { name: 'notification:read', description: 'View system notifications' },
    { name: 'farm_member:read', description: 'View farm staff members' },
    {
      name: 'farm_member:manage',
      description: 'Add, update or remove farm staff members',
    },
    {
      name: 'manager:appoint',
      description: 'Appoint or manage farm manager accounts',
    },
  ];

  const createdPermissions: Record<string, string> = {};

  for (const p of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.description },
      create: {
        name: p.name,
        description: p.description,
      },
    });
    createdPermissions[p.name] = perm.id;
  }
  console.log('✅ System permissions seeded');

  const baseManagerPermissions = [
    'dashboard:view',
    'animal:read',
    'animal:create',
    'animal:update',
    'animal:delete',
    'animal:export',
    'milk:read',
    'milk:record',
    'milk:update',
    'milk:delete',
    'health:read',
    'health:record',
    'feeding:read',
    'feeding:record',
    'breeding:read',
    'breeding:create',
    'breeding:update',
    'breeding:delete',
    'reports:read',
    'traceability:read',
    'calendar:read',
    'notification:read',
    'farm_member:read',
    'farm_member:manage',
  ];

  const rolePermissionsMap: Record<string, string[]> = {
    ['MANAGER']: baseManagerPermissions,
    ['FARMER']: [
      ...baseManagerPermissions,
      'milk:delete-permanent',
      'manager:appoint',
    ],
    ['VETERINARIAN']: [
      'dashboard:view',
      'animal:read',
      'health:record',
      'vaccination:record',
      'treatment:manage',
      'veterinary:visit',
      'calendar:read',
      'notification:read',
      'reports:read',
      'traceability:read',
      'farm_member:read',
    ],
    ['WORKER']: [
      'dashboard:view',
      'animal:read',
      'milk:read',
      'milk:record',
      'feeding:read',
      'feeding:record',
      'calendar:read',
      'notification:read',
    ],
  };

  for (const [roleName, perms] of Object.entries(rolePermissionsMap)) {
    const roleId = createdRoles[roleName];
    if (!roleId) continue;

    for (const permName of perms) {
      const permId = createdPermissions[permName];
      if (!permId) continue;

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
    }
  }
  console.log('✅ Global role permissions assigned');

  // 4. Basic Document Types
  const documentTypes = [
    {
      name: 'NATIONAL_ID_CARD',
      description: 'National Identification Document for owner/farmer',
    },
    {
      name: 'OWNERSHIP_CERTIFICATE',
      description: 'Official proof of animal ownership',
    },
    {
      name: 'HEALTH_CERTIFICATE',
      description: 'Veterinary health clearance certificate',
    },
    {
      name: 'VACCINATION_CARD',
      description: 'Official vaccination record card',
    },
    {
      name: 'GENEALOGY_CERTIFICATE',
      description: 'Pedigree and lineage certificate',
    },
    {
      name: 'IMPORT_EXPORT_PERMIT',
      description: 'Cross-border transport and trade permit',
    },
    {
      name: 'INSURANCE_POLICY',
      description: 'Animal insurance policy document',
    },
  ];

  for (const dt of documentTypes) {
    await prisma.documentType.upsert({
      where: { name: dt.name },
      update: { description: dt.description },
      create: dt,
    });
  }
  console.log('✅ Document types seeded');

  // 5. Basic Feed Types
  const feedTypes = [
    {
      name: 'GREEN_FODDER',
      description: 'Freshly cut grasses, legumes, and crops',
      unit: 'KG',
    },
    {
      name: 'DRY_FODDER',
      description: 'Hay, straw, and dried crop residues',
      unit: 'KG',
    },
    {
      name: 'CONCENTRATE',
      description: 'Grains, oilseed meals, and commercial feed pellets',
      unit: 'KG',
    },
    {
      name: 'SILAGE',
      description: 'Fermented green forage stored in silos',
      unit: 'KG',
    },
    {
      name: 'MINERAL_MIXTURE',
      description: 'Essential mineral and vitamin supplements',
      unit: 'GRAM',
    },
    {
      name: 'FEED_SUPPLEMENT',
      description: 'Nutritional and protein booster supplements',
      unit: 'GRAM',
    },
  ];

  for (const ft of feedTypes) {
    await prisma.feedType.upsert({
      where: { name: ft.name },
      update: { description: ft.description, unit: ft.unit },
      create: ft,
    });
  }
  console.log('✅ Feed types seeded');

  // 6. Basic Diseases
  const diseases = [
    {
      name: 'FOOT_AND_MOUTH_DISEASE',
      description: 'Contagious viral disease affecting cloven-hoofed animals',
      severity: 'HIGH',
    },
    {
      name: 'MASTITIS',
      description: 'Inflammation of the mammary gland and udder tissue',
      severity: 'MEDIUM',
    },
    {
      name: 'BRUCELLOSIS',
      description: 'Bacterial infection causing reproductive failure',
      severity: 'HIGH',
    },
    {
      name: 'ANTHRAX',
      description: 'Severe bacterial disease caused by Bacillus anthracis',
      severity: 'CRITICAL',
    },
    {
      name: 'BOVINE_TUBERCULOSIS',
      description: 'Chronic bacterial disease caused by Mycobacterium bovis',
      severity: 'HIGH',
    },
    {
      name: 'LUMPY_SKIN_DISEASE',
      description: 'Poxvirus infection causing skin nodules in cattle',
      severity: 'MEDIUM',
    },
    {
      name: 'BLACKLEG',
      description: 'Infectious bacterial disease causing muscle swelling',
      severity: 'HIGH',
    },
  ];

  for (const d of diseases) {
    await prisma.disease.upsert({
      where: { name: d.name },
      update: { description: d.description, severity: d.severity },
      create: d,
    });
  }
  console.log('✅ Diseases seeded');

  // 7. System Settings
  const settings = [
    {
      key: 'system_name',
      value: 'Animal Identification & Traceability System (AITS)',
      description: 'System Brand Title',
    },
    {
      key: 'qr_code_prefix',
      value: 'AITS-QR-',
      description: 'Prefix for generated QR Codes',
    },
    {
      key: 'sync_max_batch_size',
      value: 500,
      description: 'Maximum records per offline sync batch',
    },
    {
      key: 'file_upload_max_size_mb',
      value: 10,
      description: 'Maximum file size allowed for document uploads',
    },
    {
      key: 'default_language',
      value: 'en',
      description: 'Default system localization',
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: {
        key: s.key,
        value: s.value,
        description: s.description,
      },
    });
  }
  console.log('✅ System settings seeded');

  // 8. Development Administrator Account
  const adminEmail = 'admin@aits.gov';
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { status: UserStatus.ACTIVE },
    create: {
      firstName: 'System',
      lastName: 'Administrator',
      email: adminEmail,
      phone: '+18005550199',
      passwordHash: hashedPassword,
      status: UserStatus.ACTIVE,
    },
  });

  // Assign ADMIN role to the admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: createdRoles['FARMER'],
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: createdRoles['FARMER'],
    },
  });

  console.log(`✅ Development Administrator user created: ${adminEmail}`);

  // Create Notification Preference for Admin
  await prisma.notificationPreference.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      vaccinationNotifications: true,
      feedingNotifications: true,
      healthNotifications: true,
      documentNotifications: true,
      syncNotifications: true,
    },
  });

  // 9. Mock Data: Additional Users (Farmers, Managers, Vets)
  console.log('🌱 Seeding mock users (Farmers, Managers, Vets)...');
  const mockUsers: Array<{
    email: string;
    role: RoleName;
    first: string;
    last: string;
  }> = [
    {
      email: 'farmer.joe@aits.gov',
      role: 'FARMER',
      first: 'Joe',
      last: 'Farmer',
    },
    {
      email: 'farmer.mary@aits.gov',
      role: 'FARMER',
      first: 'Mary',
      last: 'Owner',
    },
    {
      email: 'manager.sam@aits.gov',
      role: 'MANAGER',
      first: 'Sam',
      last: 'Manager',
    },
    {
      email: 'vet.sarah@aits.gov',
      role: 'VETERINARIAN',
      first: 'Sarah',
      last: 'Vet',
    },
    {
      email: 'auditor.bob@aits.gov',
      role: 'WORKER',
      first: 'Bob',
      last: 'Auditor',
    },
  ];

  const createdMockUsers: Record<string, User> = {};
  for (const u of mockUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { status: UserStatus.ACTIVE },
      create: {
        firstName: u.first,
        lastName: u.last,
        email: u.email,
        phone: '+18005550000',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: createdRoles[u.role] },
      },
      update: {},
      create: { userId: user.id, roleId: createdRoles[u.role] },
    });
    createdMockUsers[u.email] = user;
  }

  // 10. Mock Data: Farms
  console.log('🌱 Seeding mock farms...');
  const farm1 = await prisma.farm.upsert({
    where: { registrationNumber: 'FARM-001' },
    update: {},
    create: {
      ownerId: createdMockUsers['farmer.joe@aits.gov'].id,
      name: 'Sunny Valley Dairy',
      registrationNumber: 'FARM-001',
      address: '123 Sunny Rd',
      province: 'Central',
      district: 'Valley',
      city: 'Greenville',
      contactNumber: '555-0101',
      farmType: 'DAIRY',
    },
  });

  const farm2 = await prisma.farm.upsert({
    where: { registrationNumber: 'FARM-002' },
    update: {},
    create: {
      ownerId: createdMockUsers['farmer.mary@aits.gov'].id,
      name: 'Highland Pastures',
      registrationNumber: 'FARM-002',
      address: '456 High Rd',
      province: 'North',
      district: 'Highland',
      city: 'Peakville',
      contactNumber: '555-0102',
      farmType: 'BEEF',
    },
  });

  // Assign Manager to Farm 1

  await prisma.farmUser.upsert({
    where: {
      farmId_userId: {
        farmId: farm1.id,
        userId: createdMockUsers['manager.sam@aits.gov'].id,
      },
    },
    update: { role: 'MANAGER', permissions: baseManagerPermissions },
    create: {
      farmId: farm1.id,
      userId: createdMockUsers['manager.sam@aits.gov'].id,
      role: 'MANAGER',
      permissions: baseManagerPermissions,
    },
  });

  // Assign Vet to Farm 1
  const vetPermissions = [
    'dashboard:view',
    'animal:read',
    'health:read',
    'health:record',
    'breeding:read',
    'breeding:create',
    'breeding:update',
    'calendar:read',
    'notification:read',
  ];
  await prisma.farmUser.upsert({
    where: {
      farmId_userId: {
        farmId: farm1.id,
        userId: createdMockUsers['vet.sarah@aits.gov'].id,
      },
    },
    update: { role: 'VETERINARIAN', permissions: vetPermissions },
    create: {
      farmId: farm1.id,
      userId: createdMockUsers['vet.sarah@aits.gov'].id,
      role: 'VETERINARIAN',
      permissions: vetPermissions,
    },
  });

  // Assign Auditor to Farm 1
  const auditorPermissions = [
    'dashboard:view',
    'animal:read',
    'milk:read',
    'health:read',
    'feeding:read',
    'breeding:read',
    'reports:read',
    'traceability:read',
    'farm_member:read',
  ];
  await prisma.farmUser.upsert({
    where: {
      farmId_userId: {
        farmId: farm1.id,
        userId: createdMockUsers['auditor.bob@aits.gov'].id,
      },
    },
    update: { role: 'AUDITOR', permissions: auditorPermissions },
    create: {
      farmId: farm1.id,
      userId: createdMockUsers['auditor.bob@aits.gov'].id,
      role: 'AUDITOR',
      permissions: auditorPermissions,
    },
  });

  // 11. Mock Data: Animals
  console.log('🌱 Seeding mock animals...');
  const animals: Animal[] = [];

  for (let i = 1; i <= 60; i++) {
    const isFarm1 = i <= 40;
    const farmId = isFarm1 ? farm1.id : farm2.id;
    const gender = i % 5 === 0 ? AnimalGender.MALE : AnimalGender.FEMALE;
    let status: AnimalStatus = AnimalStatus.ACTIVE;
    if (i === 15 || i === 10 || i === 20) status = AnimalStatus.QUARANTINED;
    if (i === 50) status = AnimalStatus.SOLD;

    const animal = await prisma.animal.upsert({
      where: { animalNumber: `TAG-${i.toString().padStart(4, '0')}` },
      update: { status, farmId, gender },
      create: {
        farmId,
        animalNumber: `TAG-${i.toString().padStart(4, '0')}`,
        name: `Cow ${i}`,
        species: 'BOVINE',
        breed: isFarm1 ? 'Holstein' : 'Angus',
        gender,
        dateOfBirth: new Date(
          Date.now() - Math.floor(Math.random() * 1000) * 24 * 60 * 60 * 1000,
        ), // Random age
        status,
        registrationDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
    });
    animals.push(animal);
  }

  // 12. Mock Data: Milk Production
  console.log('🌱 Seeding mock milk production...');
  const femaleCows = animals.filter(
    (a) =>
      a.gender === AnimalGender.FEMALE &&
      a.status === AnimalStatus.ACTIVE &&
      a.farmId === farm1.id,
  );
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  // Clean old milk records for these cows to ensure idempotency
  await prisma.milkProduction.deleteMany({
    where: { animalId: { in: femaleCows.map((c) => c.id) } },
  });

  const milkRecordsToInsert: Prisma.MilkProductionCreateManyInput[] = [];
  // 60 days of history
  for (let d = 60; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
    // About 20 cows produce milk each day
    for (let c = 0; c < 20; c++) {
      const cow = femaleCows[c];
      if (!cow) continue;

      // Morning
      milkRecordsToInsert.push({
        animalId: cow.id,
        farmId: cow.farmId,
        recordedById: createdMockUsers['manager.sam@aits.gov'].id,
        productionDate: date,
        milkingSession: MilkingSession.MORNING,
        quantityLiters: 10 + Math.random() * 5,
        milkQuality: 'EXCELLENT',
      });
      // Evening
      milkRecordsToInsert.push({
        animalId: cow.id,
        farmId: cow.farmId,
        recordedById: createdMockUsers['manager.sam@aits.gov'].id,
        productionDate: date,
        milkingSession: MilkingSession.EVENING,
        quantityLiters: 8 + Math.random() * 4,
        milkQuality: Math.random() > 0.9 ? 'FAIR' : 'GOOD',
      });
    }
  }

  // Batch insert milk
  // Prisma createMany is supported in Postgres
  if (milkRecordsToInsert.length > 0) {
    await prisma.milkProduction.createMany({ data: milkRecordsToInsert });
  }

  // 13. Mock Data: Health Cases & Quarantines
  console.log('🌱 Seeding mock health & pregnancies...');
  const sickCows = animals.filter((a) => a.status === 'QUARANTINED');
  for (const cow of sickCows) {
    // Upsert a health case
    await prisma.healthCase.upsert({
      where: { caseNumber: `HC-${cow.animalNumber}` },
      update: { status: 'OPEN' },
      create: {
        caseNumber: `HC-${cow.animalNumber}`,
        farmId: cow.farmId,
        animalId: cow.id,
        title: 'Routine Sickness',
        status: 'OPEN',
        veterinarianId: createdMockUsers['vet.sarah@aits.gov'].id,
        openedAt: new Date(),
      },
    });

    if (cow.status === 'QUARANTINED') {
      await prisma.quarantineRecord
        .upsert({
          where: { id: `QR-${cow.animalNumber}` }, // Using a pseudo-id for upsert isn't directly supported by Prisma unless unique. We will just use findFirst and create
          update: {},
          create: {
            id: `QR-${cow.animalNumber}`,
            farmId: cow.farmId,
            animalId: cow.id,
            orderedById: createdMockUsers['vet.sarah@aits.gov'].id,
            startDate: new Date(),
            reason: 'Contagious symptoms',
            status: 'ACTIVE',
            zoneName: 'Zone A',
            expectedRelease: new Date(
              today.getTime() + 10 * 24 * 60 * 60 * 1000,
            ),
          },
        })
        .catch(async () => {
          // If it exists but no unique constraint, check first
          const existing = await prisma.quarantineRecord.findFirst({
            where: { animalId: cow.id, status: 'ACTIVE' },
          });
          if (!existing) {
            await prisma.quarantineRecord.create({
              data: {
                farmId: cow.farmId,
                animalId: cow.id,
                orderedById: createdMockUsers['vet.sarah@aits.gov'].id,
                startDate: new Date(),
                reason: 'Contagious symptoms',
                status: 'ACTIVE',
                zoneName: 'Zone A',
                expectedRelease: new Date(
                  today.getTime() + 10 * 24 * 60 * 60 * 1000,
                ),
              },
            });
          }
        });
    }
  }

  // Pregnancies
  const pregnantCows = femaleCows.slice(20, 25);
  for (const cow of pregnantCows) {
    const existingPreg = await prisma.pregnancy.findFirst({
      where: { animalId: cow.id, status: 'CONFIRMED' },
    });
    if (!existingPreg) {
      await prisma.pregnancy.create({
        data: {
          animal: { connect: { id: cow.id } },
          breedingRecord: {
            create: {
              femaleAnimal: { connect: { id: cow.id } },
              breedingDate: new Date(
                today.getTime() - 60 * 24 * 60 * 60 * 1000,
              ),
              breedingMethod: 'NATURAL',
              status: 'COMPLETED',
              technician: {
                connect: { id: createdMockUsers['vet.sarah@aits.gov'].id },
              },
            },
          },
          pregnancyDate: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
          expectedCalvingDate: new Date(
            today.getTime() + 200 * 24 * 60 * 60 * 1000,
          ),
          status: 'CONFIRMED',
        },
      });
    }
  }

  // 14. Mock Data: Inter-Farm Transfers
  console.log('🌱 Seeding mock transfers...');
  const transferAnimal = animals.find((a) => a.animalNumber === 'TAG-0030');
  if (transferAnimal) {
    const existingTransfer = await prisma.farmTransfer.findFirst({
      where: { animalId: transferAnimal.id },
    });
    if (!existingTransfer) {
      await prisma.farmTransfer.create({
        data: {
          animal: { connect: { id: transferAnimal.id } },
          fromFarm: { connect: { id: farm1.id } },
          toFarm: { connect: { id: farm2.id } },
          recordedBy: {
            connect: { id: createdMockUsers['farmer.joe@aits.gov'].id },
          },
          departureDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          departureTime: '08:00',
          expectedArrivalDate: new Date(
            today.getTime() - 5 * 24 * 60 * 60 * 1000,
          ),
          expectedArrivalTime: '14:00',
          reason: 'SALE_OR_MARKET',
          status: 'COMPLETED',
        },
      });
    }
  }

  console.log('🌱 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
