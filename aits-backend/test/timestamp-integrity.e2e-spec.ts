import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Timestamp & Time Period Integrity (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtToken: string;
  let testFarmId: string;
  let testAnimalId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Clean up from previous failed runs
    await prisma.milkProduction.deleteMany({
      where: { animal: { farm: { registrationNumber: 'TEST-FARM-TS' } } },
    });
    await prisma.animal.deleteMany({
      where: { farm: { registrationNumber: 'TEST-FARM-TS' } },
    });
    await prisma.farmUser.deleteMany({
      where: { user: { email: 'timestamp-tester@example.com' } },
    });
    await prisma.farm.deleteMany({
      where: { registrationNumber: 'TEST-FARM-TS' },
    });
    await prisma.user.deleteMany({
      where: { email: 'timestamp-tester@example.com' },
    });

    // 1. Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'timestamp-tester@example.com',
        passwordHash: 'fake',
        firstName: 'Time',
        lastName: 'Tester',
      },
    });

    // 2. Create a farm
    const farm = await prisma.farm.create({
      data: {
        name: 'Timestamp Test Farm',
        registrationNumber: 'TEST-FARM-TS',
        address: '123 Farm Road',
        province: 'Western',
        district: 'Colombo',
        city: 'Colombo',
        contactNumber: '1234567890',
        farmType: 'DAIRY',
        ownerId: user.id,
      },
    });
    testFarmId = farm.id;

    // Assign user to farm
    await prisma.farmUser.create({
      data: {
        userId: user.id,
        farmId: testFarmId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    // 3. Login to get token
    const jwtService = app.get(JwtService);
    jwtToken = jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: process.env.JWT_SECRET || 'test-secret' },
    );

    // 4. Create an animal to test milk production logging
    const animal = await prisma.animal.create({
      data: {
        farmId: testFarmId,
        animalNumber: 'TST-TIME-001',
        species: 'BOVINE',
        breed: 'Holstein',
        dateOfBirth: new Date(),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    });
    testAnimalId = animal.id;
  });

  afterAll(async () => {
    if (testFarmId) {
      await prisma.milkProduction.deleteMany({ where: { farmId: testFarmId } });
      await prisma.farmUser.deleteMany({ where: { farmId: testFarmId } });
    }
    if (testAnimalId) {
      await prisma.animal.delete({ where: { id: testAnimalId } });
    }
    if (testFarmId) {
      await prisma.farm.delete({ where: { id: testFarmId } });
    }
    await prisma.user.deleteMany({
      where: { email: 'timestamp-tester@example.com' },
    });
    await app.close();
  });

  it('ignores client-provided createdAt when logging milk production', async () => {
    const fakePastDate = new Date('2020-01-01T00:00:00.000Z').toISOString();

    const response = await request(app.getHttpServer())
      .post('/api/v1/milk-production')
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({ farmId: testFarmId })
      .send({
        animalId: testAnimalId,
        date: new Date().toISOString().split('T')[0], // business date
        session: 'MORNING',
        quantityLiters: 12.5,
        qualityStatus: 'ACCEPTED',
        createdAt: fakePastDate, // trying to manipulate timestamp
      })
      .expect(201);

    if (
      !response.body ||
      typeof response.body !== 'object' ||
      !('id' in response.body) ||
      typeof (response.body as { id: unknown }).id !== 'string'
    ) {
      throw new Error('Invalid response body: expected object with string id');
    }

    const recordId = (response.body as { id: string }).id;

    const record = await prisma.milkProduction.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new Error('Record not found');
    }

    // The created record's createdAt should NOT be the fake past date
    expect(record.createdAt.toISOString()).not.toBe(fakePastDate);

    // It should be created just now (within the last minute)
    const timeDiffMs = Date.now() - record.createdAt.getTime();
    expect(timeDiffMs).toBeLessThan(60000);
  });
});
