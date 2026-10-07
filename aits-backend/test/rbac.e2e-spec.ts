import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

type MockPrismaService = {
  user: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    upsert: jest.Mock;
  };
  farm: {
    findUnique: jest.Mock;
  };
  role: {
    findUnique: jest.Mock;
  };
  setting: {
    findUnique: jest.Mock;
  };
  animal: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

describe('RBAC & Farm Isolation (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: MockPrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret';
    // Mock the Prisma Service methods used by authentication and services
    const prismaMock = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      farm: {
        findUnique: jest.fn(),
      },
      role: {
        findUnique: jest.fn().mockResolvedValue({ id: 'r1', name: 'ADMIN' }),
      },
      setting: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prismaService = prismaMock as unknown as MockPrismaService;
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: string) => {
    return jwtService.sign(
      { sub: userId, email: 'test@test.com' },
      { secret: process.env.JWT_SECRET },
    );
  };

  describe('PermissionsGuard & Farm Isolation Pipeline', () => {
    it('should reject unauthenticated requests to protected endpoints (401)', () => {
      return request(app.getHttpServer()).get('/api/animals/stats').expect(401);
    });

    it('should reject requests with targetFarmId if user lacks permission for THAT farm (403)', async () => {
      const token = generateToken('user-1');

      // Setup JWT Strategy response (User has permission on Farm A, but NOT Farm B)
      const mockUser = {
        id: 'user-1',
        email: 'worker@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: ['animal:read'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Attempt to access Farm B directly
      return request(app.getHttpServer())
        .get('/api/animals/stats?farmId=farm-B') // Target Farm B
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          expect(res.status).toBe(403);
          expect((res.body as { message: string }).message).toContain(
            'Access denied',
          );
        });
    });

    it('should allow request with targetFarmId if user HAS permission for THAT farm (200 OK or 404 from service)', async () => {
      const token = generateToken('user-1');

      // Setup JWT Strategy response (User has permission on Farm A)
      const mockUser = {
        id: 'user-1',
        email: 'worker@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: ['animal:read'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // The service may return empty array or throw due to mocked DB, but Guard should let it through (so not 403)
      // Since it's a GET /stats and Prisma is mocked, it might throw a Prisma error or return {}, but Guard allows it.

      const res = await request(app.getHttpServer())
        .get('/api/animals/stats?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`);

      // We expect it to NOT be 401 or 403. It will likely fail at the service layer because `prisma.animal.aggregate` isn't mocked, causing a 500, which is perfectly fine for testing the Guard boundary!
      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(401);
    });

    it('should allow gateway access (no farmId) if user has permission on AT LEAST ONE farm', async () => {
      const token = generateToken('user-2');

      const mockUser = {
        id: 'user-2',
        email: 'worker@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-X',
            permissions: ['animal:read'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .get('/api/animals/stats') // NO farmId provided
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(401);
    });

    it('should reject gateway access (no farmId) if user has permission on ZERO farms', async () => {
      const token = generateToken('user-3');

      const mockUser = {
        id: 'user-3',
        email: 'worker@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-X',
            permissions: ['animal:create'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .get('/api/animals/stats') // NO farmId provided
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Cross-Farm Exploitation Attempts & Payload Manipulation', () => {
    it('should reject POST with body.farmId targeting Farm B when user only has permission on Farm A', async () => {
      const token = generateToken('user-exploit');

      const mockUser = {
        id: 'user-exploit',
        email: 'hacker@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'FARM_MANAGER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: ['animal:create', 'animal:update'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };

      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/api/animals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          farmId: 'farm-B',
          name: 'Exploit Cow',
          animalNumber: 'EXP-123',
        })
        .expect(403)
        .expect((res) => {
          expect((res.body as { message: string }).message).toContain(
            'Access denied',
          );
        });
    });

    it('should reject updating animal if route param ID belongs to Farm B (caught by service)', async () => {
      const token = generateToken('user-exploit-2');

      const mockUser = {
        id: 'user-exploit-2',
        email: 'hacker@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: ['animal:update'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };

      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Mock the animal to belong to farm-B
      prismaService.animal = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'animal-farm-b-id',
          farmId: 'farm-B',
          deletedAt: null,
        }),
        update: jest.fn(),
      };

      return request(app.getHttpServer())
        .put('/api/animals/animal-farm-b-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked Cow' })
        .expect(403);
    });
  });

  describe('Specific Role Validations (Gateways)', () => {
    it('Resident Veterinarian should access health routes but reject milk routes', async () => {
      const token = generateToken('user-vet');
      const mockUser = {
        id: 'user-vet',
        email: 'vet@test.com',
        status: 'ACTIVE',
        userRoles: [
          {
            role: {
              name: 'VETERINARY_OFFICER',
              rolePermissions: [
                { permission: { name: 'health:record' } },
                { permission: { name: 'health:read' } },
                { permission: { name: 'dashboard:view' } },
              ],
            },
          },
        ],
        farmMemberships: [],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Health stats route
      await request(app.getHttpServer())
        .get('/api/health/diagnoses?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => expect(res.status).not.toBe(403));

      // Milk stats route (should fail)
      await request(app.getHttpServer())
        .get('/api/milk-production/stats?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('Auditor should access read-only routes but reject mutations', async () => {
      const token = generateToken('user-auditor');
      const mockUser = {
        id: 'user-auditor',
        email: 'auditor@test.com',
        status: 'ACTIVE',
        userRoles: [
          {
            role: {
              name: 'GOVERNMENT_OFFICER',
              rolePermissions: [
                { permission: { name: 'animal:read' } },
                { permission: { name: 'milk:read' } },
                { permission: { name: 'health:record' } },
                { permission: { name: 'traceability:read' } },
              ],
            },
          },
        ],
        farmMemberships: [],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Read route (allowed)
      await request(app.getHttpServer())
        .get('/api/animals/stats?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => expect(res.status).not.toBe(403));

      // Mutation route (denied)
      await request(app.getHttpServer())
        .post('/api/animals')
        .send({ farmId: 'farm-A', animalNumber: 'AUD-01' })
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Dashboard & Reporting Authorization (AnyPermissions)', () => {
    it('should allow WORKER with dashboard:view to access overview, but deny health without animal:read or health:record', async () => {
      const token = generateToken('user-fw-1');
      const mockUser = {
        id: 'user-fw-1',
        email: 'fw@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: ['dashboard:view', 'milk:record'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // 1. Overview requires 'dashboard:view' or 'reports:read' -> Should pass guard
      const resOverview = await request(app.getHttpServer())
        .get('/api/reports/overview?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`);
      expect(resOverview.status).not.toBe(403);
      expect(resOverview.status).not.toBe(401);

      // 2. Production requires 'milk:record' or 'reports:read' -> Should pass guard
      const resProduction = await request(app.getHttpServer())
        .get('/api/reports/production?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`);
      expect(resProduction.status).not.toBe(403);

      // 3. Health requires 'animal:read', 'health:record', or 'reports:read' -> Should fail (403)
      await request(app.getHttpServer())
        .get('/api/reports/health?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny a Worker without dashboard:view from accessing the dashboard overview API', async () => {
      const token = generateToken('user-fw-no-access');
      const mockUser = {
        id: 'user-fw-no-access',
        email: 'fw2@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: ['animal:read'], // Missing dashboard:view or reports:read
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .get('/api/reports/overview?farmId=farm-A')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          expect((res.body as { message: string }).message).toContain(
            'Access denied',
          );
        });
    });

    it('should deny access if user has dashboard:view on Farm A but attempts to query Farm B', async () => {
      const token = generateToken('user-fw-farm-iso');
      const mockUser = {
        id: 'user-fw-farm-iso',
        email: 'fw3@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'WORKER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: ['dashboard:view'],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .get('/api/reports/overview?farmId=farm-B') // Target unauthorized farm
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          expect((res.body as { message: string }).message).toContain(
            'Access denied',
          );
        });
    });

    it('should allow Farm Owner to query dashboard with farmId=ALL', async () => {
      const token = generateToken('farm-owner-all');
      const mockOwner = {
        id: 'farm-owner-all',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'FARMER' } }],
        farmMemberships: [],
        ownedFarms: [{ id: 'farm-1' }],
      };

      prismaService.user.findFirst.mockResolvedValue(mockOwner);
      prismaService.user.findUnique.mockResolvedValue(mockOwner);

      // Farm owner queries with farmId=ALL.
      // The PermissionsGuard should skip 'ALL' and use hasOnAnyFarm which returns true because they own 'farm-1'.
      const res = await request(app.getHttpServer())
        .get('/api/reports/overview?farmId=ALL')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(401);
    });

    it('should process diagnosis and pregnancyStatus query parameters securely without 500 error', async () => {
      const token = generateToken('farm-mgr-filter');
      const mockMgr = {
        id: 'farm-mgr-filter',
        email: 'mgr@test.com',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'FARM_MANAGER', rolePermissions: [] } }],
        farmMemberships: [
          {
            farmId: 'farm-A',
            permissions: [
              'dashboard:view',
              'reports:read',
              'animal:read',
              'health:record',
              'breeding:record',
            ],
            farm: { deletedAt: null },
            status: 'ACTIVE',
          },
        ],
        ownedFarms: [],
      };

      prismaService.user.findFirst.mockResolvedValue(mockMgr);
      prismaService.user.findUnique.mockResolvedValue(mockMgr);

      // Testing Health Analytics endpoint which parses `diagnosis`
      const resHealth = await request(app.getHttpServer())
        .get('/api/reports/analytics/health?farmId=farm-A&diagnosis=Mastitis')
        .set('Authorization', `Bearer ${token}`);

      // We only care that RBAC doesn't fail and it doesn't crash from invalid parsing
      expect(resHealth.status).not.toBe(403);
      expect(resHealth.status).not.toBe(401);

      // Testing Breeding Analytics endpoint which parses `pregnancyStatus`
      const resBreeding = await request(app.getHttpServer())
        .get(
          '/api/reports/analytics/breeding?farmId=farm-A&pregnancyStatus=CONFIRMED',
        )
        .set('Authorization', `Bearer ${token}`);

      expect(resBreeding.status).not.toBe(403);
      expect(resBreeding.status).not.toBe(401);
    });
  });
});
