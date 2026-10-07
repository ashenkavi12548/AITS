import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Health Management Integration (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let testUserIdA: string;
  let testUserIdB: string;
  let farmIdA: string;

  let animalIdA: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-integration-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // 1. Clean the database
    await prisma.healthClearance.deleteMany();
    await prisma.movementRestriction.deleteMany();
    await prisma.animal.deleteMany();
    await prisma.farmUser.deleteMany();
    await prisma.farm.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    // 2. Setup Roles
    const roleFarmer = await prisma.role.create({
      data: { name: 'FARMER' },
    });

    // 3. Setup Users
    const userA = await prisma.user.create({
      data: {
        email: 'userA@test.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'dummy',
        status: 'ACTIVE',
        userRoles: {
          create: { roleId: roleFarmer.id },
        },
      },
    });
    testUserIdA = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: 'userB@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        passwordHash: 'dummy',
        status: 'ACTIVE',
        userRoles: {
          create: { roleId: roleFarmer.id },
        },
      },
    });
    testUserIdB = userB.id;

    // 4. Setup Farms & Memberships
    const farmA = await prisma.farm.create({
      data: {
        name: 'Farm A',
        registrationNumber: 'REG-A-001',
        ownerId: testUserIdA,
        address: '123 Farm Rd',
        province: 'North',
        district: 'A',
        city: 'Town',
        contactNumber: '123456789',
        farmType: 'DAIRY',
        status: 'ACTIVE',
        users: {
          create: {
            userId: testUserIdA,
            status: 'ACTIVE',
            permissions: ['health:record', 'animal:read'],
          },
        },
      },
    });
    farmIdA = farmA.id;

    await prisma.farm.create({
      data: {
        name: 'Farm B',
        registrationNumber: 'REG-B-001',
        ownerId: testUserIdB,
        address: '123 Farm Rd',
        province: 'North',
        district: 'A',
        city: 'Town',
        contactNumber: '123456789',
        farmType: 'DAIRY',
        status: 'ACTIVE',
        users: {
          create: {
            userId: testUserIdB,
            status: 'ACTIVE',
            permissions: ['health:record', 'animal:read'],
          },
        },
      },
    });

    // 5. Setup Animal on Farm A
    const animalA = await prisma.animal.create({
      data: {
        animalNumber: 'COW-A-01',
        name: 'Bessie',
        species: 'Bovine',
        breed: 'Holstein',
        gender: 'FEMALE',
        dateOfBirth: new Date(),
        farmId: farmIdA,
        status: 'ACTIVE',
      },
    });
    animalIdA = animalA.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.healthClearance.deleteMany();
    await prisma.movementRestriction.deleteMany();
    await prisma.animal.deleteMany();
    await prisma.farmUser.deleteMany();
    await prisma.farm.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    await app.close();
  });

  const generateToken = (userId: string) => {
    return jwtService.sign(
      { sub: userId, email: 'test@test.com' },
      { secret: process.env.JWT_SECRET },
    );
  };

  describe('Real DB RBAC Isolation', () => {
    it('User A should be able to evaluate animal on Farm A', async () => {
      const token = generateToken(testUserIdA);

      const res = await request(app.getHttpServer())
        .get(`/api/health/animals/${animalIdA}/eligibility`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect((res.body as Record<string, unknown>).animalNumber).toBe(
        'COW-A-01',
      );
    });

    it('User B should be FORBIDDEN from evaluating animal on Farm A', async () => {
      const token = generateToken(testUserIdB);

      await request(app.getHttpServer())
        .get(`/api/health/animals/${animalIdA}/eligibility`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Movement Restrictions & Clearance Granularity', () => {
    let restrictionId: string;

    it('Should allow SLAUGHTER and TRANSIT clearance when no restrictions exist', async () => {
      const token = generateToken(testUserIdA);

      const res = await request(app.getHttpServer())
        .post(`/api/health/clearances`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          animalTag: 'COW-A-01',
          purpose: 'SLAUGHTER',
          destination: 'Abattoir',
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          conditions: 'Healthy',
        });

      expect(res.status).toBe(201);
    });

    it('Should block SALE/EXPORT but allow SLAUGHTER/TRANSIT when SALE restriction applies', async () => {
      const token = generateToken(testUserIdA);

      // Insert a SALE restriction
      const restriction = await prisma.movementRestriction.create({
        data: {
          animalId: animalIdA,
          farmId: farmIdA,
          restrictionType: 'SALE',
          reason: 'Ownership dispute',
          imposedById: testUserIdA,
          status: 'ACTIVE',
          startDate: new Date(),
        },
      });
      restrictionId = restriction.id;

      // Verify State reflects Sale block
      const stateRes = await request(app.getHttpServer())
        .get(`/api/health/animals/${animalIdA}/eligibility`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = stateRes.body as { eligibility: Record<string, boolean> };
      expect(body.eligibility.canSale).toBe(false);
      expect(body.eligibility.canExport).toBe(false);
      expect(body.eligibility.canSlaughter).toBe(true);
      expect(body.eligibility.canTransfer).toBe(true);

      // Attempt SALE clearance -> Should Fail (400)
      await request(app.getHttpServer())
        .post(`/api/health/clearances`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          animalTag: 'COW-A-01',
          purpose: 'LIVE_SALE',
          destination: 'Market',
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          conditions: 'Healthy',
        })
        .expect(400);

      // Attempt SLAUGHTER clearance -> Should Succeed (201)
      await request(app.getHttpServer())
        .post(`/api/health/clearances`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          animalTag: 'COW-A-01',
          purpose: 'SLAUGHTER',
          destination: 'Abattoir',
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          conditions: 'Healthy',
        })
        .expect(201);
    });

    it('Should block ALL clearances when ALL restriction applies', async () => {
      const token = generateToken(testUserIdA);

      await prisma.movementRestriction.update({
        where: { id: restrictionId },
        data: { restrictionType: 'ALL', reason: 'Foot and Mouth Outbreak' },
      });

      // Attempt SLAUGHTER clearance -> Should Fail (400)
      await request(app.getHttpServer())
        .post(`/api/health/clearances`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          animalTag: 'COW-A-01',
          purpose: 'SLAUGHTER',
          destination: 'Abattoir',
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          conditions: 'Healthy',
        })
        .expect(400);
    });
  });
});
