import axios from 'axios';
import * as fs from 'fs';

const API_BASE = 'http://localhost:5001/api/v1';
const results: unknown[] = [];

function recordResult(
  workflow: string,
  name: string,
  endpoint: string,
  method: string,
  status: number,
  data: unknown,
  outcome: 'PASS' | 'FAIL',
  expectedStatus?: number,
) {
  const passed = expectedStatus
    ? status === expectedStatus
    : status >= 200 && status < 300;
  const finalOutcome = passed ? 'PASS' : 'FAIL';
  results.push({
    workflow,
    name,
    endpoint,
    method,
    status,
    expectedStatus,
    outcome: finalOutcome,
    data: JSON.stringify(data).substring(0, 150),
  });
  console.log(
    `[${finalOutcome}] ${workflow} - ${name} | ${method} ${endpoint} (Got: ${status})`,
  );
}

async function runTests() {
  console.log(
    'Starting E2E Mobile Workflow Audit against Localhost Backend...',
  );

  try {
    // ---------------------------------------------------------
    // WORKFLOW 1: Authentication & Sessions
    // ---------------------------------------------------------
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'farmer.joe@aits.gov',
      password: 'Admin123!@#',
    });
    const tokenJoe = (loginRes.data as { accessToken: string }).accessToken;
    const farmIdJoe = (
      loginRes.data as {
        accessToken: string;
        refreshToken: string;
        user: { primaryFarmId: string };
      }
    ).user.primaryFarmId;
    recordResult(
      'Auth',
      'Farmer Login',
      '/auth/login',
      'POST',
      loginRes.status,
      loginRes.data,
      'PASS',
    );

    const clientJoe = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${tokenJoe}` },
    });

    // Refresh Token
    const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken: (
        loginRes.data as {
          accessToken: string;
          refreshToken: string;
          user: { primaryFarmId: string };
        }
      ).refreshToken,
    });
    recordResult(
      'Auth',
      'Token Refresh',
      '/auth/refresh',
      'POST',
      refreshRes.status,
      {},
      'PASS',
    );

    // Me
    const meRes = await clientJoe.get('/auth/me');
    recordResult(
      'Auth',
      'Get Profile',
      '/auth/me',
      'GET',
      meRes.status,
      meRes.data,
      'PASS',
    );

    // ---------------------------------------------------------
    // WORKFLOW 2: Animal Registration & Search
    // ---------------------------------------------------------
    const newAnimal = await clientJoe.post('/animals', {
      farmId: farmIdJoe,
      animalNumber: `NEW-TAG-${Date.now()}`,
      species: 'BOVINE',
      breed: 'Holstein',
      gender: 'FEMALE',
      dateOfBirth: '2023-01-01T00:00:00Z',
      status: 'ACTIVE',
    });
    recordResult(
      'Animals',
      'Register Animal',
      '/animals',
      'POST',
      newAnimal.status,
      newAnimal.data,
      'PASS',
    );
    console.log('NEW ANIMAL RESPONSE:', newAnimal.data);
    if (
      !newAnimal.data ||
      !(newAnimal.data as { animal: { id: string; animalNumber: string } })
        .animal
    ) {
      throw new Error(
        `Animal registration failed: ${JSON.stringify(newAnimal.data as { animal: { id: string; animalNumber: string } })}`,
      );
    }
    const animalId = (
      newAnimal.data as { animal: { id: string; animalNumber: string } }
    ).animal.id;
    const tag = (
      newAnimal.data as { animal: { id: string; animalNumber: string } }
    ).animal.animalNumber;

    // Search
    const searchRes = await clientJoe.get(`/animals?search=${tag}&limit=5`);
    recordResult(
      'Animals',
      'Manual ID Search',
      '/animals',
      'GET',
      searchRes.status,
      searchRes.data,
      'PASS',
    );

    // Profile
    const profileRes = await clientJoe.get(`/animals/${animalId}`);
    recordResult(
      'Animals',
      'View Profile',
      `/animals/${animalId}`,
      'GET',
      profileRes.status,
      profileRes.data,
      'PASS',
    );

    // Update
    const updateRes = await clientJoe.patch(`/animals/${animalId}`, {
      name: 'Bessie 2.0',
    });
    recordResult(
      'Animals',
      'Edit Profile',
      `/animals/${animalId}`,
      'PATCH',
      updateRes.status,
      updateRes.data,
      'PASS',
    );

    // ---------------------------------------------------------
    // WORKFLOW 3: Milk Production Entry
    // ---------------------------------------------------------
    const milkRes = await clientJoe.post('/milk-production', {
      animalId,
      farmId: farmIdJoe,
      productionDate: new Date().toISOString(),
      milkingSession: 'MORNING',
      quantityLiters: 15,
      milkQuality: 'EXCELLENT',
    });
    recordResult(
      'Milk',
      'Log Milk',
      '/milk-production',
      'POST',
      milkRes.status,
      milkRes.data,
      'PASS',
    );

    const milkHistory = await clientJoe.get(
      `/milk-production?animalId=${animalId}`,
    );
    recordResult(
      'Milk',
      'Milk History',
      '/milk-production',
      'GET',
      milkHistory.status,
      milkHistory.data,
      'PASS',
    );

    // ---------------------------------------------------------
    // WORKFLOW 4: Health Workflows
    // ---------------------------------------------------------
    const healthRes = await clientJoe.post('/health/examinations', {
      animalTag: tag,
      temperature: 38.5,
      heartRate: 60,
      respiratoryRate: 20,
      initialAssessment: 'Healthy',
      notes: 'Routine check',
    });
    recordResult(
      'Health',
      'Log Exam',
      '/health/examinations',
      'POST',
      healthRes.status,
      healthRes.data,
      'PASS',
    );

    // ---------------------------------------------------------
    // WORKFLOW 5: Breeding Workflows
    // ---------------------------------------------------------
    const breedRes = await clientJoe.post('/breeding', {
      femaleAnimalId: animalId,
      farmId: farmIdJoe,
      serviceDate: new Date().toISOString(),
      serviceMethod: 'ARTIFICIAL_INSEMINATION',
      technician: 'Dr. Smith',
    });
    recordResult(
      'Breeding',
      'Log Breeding',
      '/breeding',
      'POST',
      breedRes.status,
      breedRes.data,
      'PASS',
    );

    // ---------------------------------------------------------
    // WORKFLOW 6: RBAC Validations (Worker/Auditor)
    // ---------------------------------------------------------
    const auditorLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'auditor.bob@aits.gov',
      password: 'Admin123!@#',
    });
    const clientBob = axios.create({
      baseURL: API_BASE,
      headers: {
        Authorization: `Bearer ${(auditorLogin.data as { accessToken: string }).accessToken}`,
      },
    });

    // Read should pass
    const bobRead = await clientBob.get(`/animals/${animalId}`);
    recordResult(
      'RBAC',
      'Auditor Read Animal',
      `/animals/${animalId}`,
      'GET',
      bobRead.status,
      bobRead.data,
      'PASS',
    );

    // Write should fail 403
    try {
      await clientBob.post('/milk-production', {
        animalId,
        farmId: farmIdJoe,
        productionDate: new Date().toISOString(),
        milkingSession: 'EVENING',
        quantityLiters: 10,
      });
      recordResult(
        'RBAC',
        'Auditor Write Milk',
        '/milk-production',
        'POST',
        201,
        'Did not block',
        'FAIL',
        403,
      );
    } catch (err: unknown) {
      recordResult(
        'RBAC',
        'Auditor Write Milk',
        '/milk-production',
        'POST',
        (
          err as {
            message?: string;
            response?: { status?: number; data?: unknown };
          }
        ).response?.status || 500,
        (
          err as {
            message?: string;
            response?: { status?: number; data?: unknown };
          }
        ).response?.data,
        'PASS',
        403,
      );
    }

    // ---------------------------------------------------------
    // WORKFLOW 7: Farm Isolation
    // ---------------------------------------------------------
    // Mary is Farmer 2. Let's see if Joe can access Mary's farm stats
    try {
      // Find farm 2 ID from db
      // We can test by trying to fetch a random UUID and expecting 403
      const fakeFarmId = '00000000-0000-0000-0000-000000000002';
      await clientJoe.get(`/animals/stats?farmId=${fakeFarmId}`);
      recordResult(
        'Isolation',
        'Cross-Farm Access',
        '/animals/stats',
        'GET',
        200,
        'Did not block',
        'FAIL',
        403,
      );
    } catch (err: unknown) {
      recordResult(
        'Isolation',
        'Cross-Farm Access',
        '/animals/stats',
        'GET',
        (
          err as {
            message?: string;
            response?: { status?: number; data?: unknown };
          }
        ).response?.status || 500,
        (
          err as {
            message?: string;
            response?: { status?: number; data?: unknown };
          }
        ).response?.data,
        'PASS',
        403,
      );
    }
  } catch (err: unknown) {
    console.error(
      'Fatal Error during E2E Execution:',
      (
        err as {
          message?: string;
          response?: { status?: number; data?: unknown };
        }
      ).message,
      (
        err as {
          message?: string;
          response?: { status?: number; data?: unknown };
        }
      ).response?.data || err,
    );
  }

  fs.writeFileSync('e2e-results.json', JSON.stringify(results, null, 2));
  console.log('Tests completed. Results saved to e2e-results.json');
}

runTests().catch(console.error);
