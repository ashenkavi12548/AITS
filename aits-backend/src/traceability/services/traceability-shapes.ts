import { Prisma } from '@prisma/client';

export const animalSelect = {
  id: true,
  animalNumber: true,
  name: true,
  gender: true,
  breed: true,
  dateOfBirth: true,
  status: true,
  imageUrl: true,
  farmId: true,
  createdAt: true,
  farm: { select: { id: true, name: true } },
  identifiers: {
    select: { identifierValue: true, isPrimary: true, identifierType: true },
  },
} satisfies Prisma.AnimalSelect;

export const activityInclude = {
  animal: {
    select: {
      id: true,
      animalNumber: true,
      name: true,
      species: true,
      imageUrl: true,
      identifiers: { select: { identifierValue: true, isPrimary: true } },
    },
  },
  farm: { select: { id: true, name: true } },
  recordedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.DailyActivityLogInclude;

export type ActivityWithRelations = Prisma.DailyActivityLogGetPayload<{
  include: typeof activityInclude;
}>;

export const transferInclude = {
  animal: {
    select: {
      id: true,
      animalNumber: true,
      name: true,
      species: true,
      imageUrl: true,
      status: true,
      identifiers: { select: { identifierValue: true, isPrimary: true } },
    },
  },
  fromFarm: { select: { id: true, name: true } },
  toFarm: { select: { id: true, name: true } },
  recordedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.FarmTransferInclude;

export type TransferWithRelations = Prisma.FarmTransferGetPayload<{
  include: typeof transferInclude;
}>;

export function shapeActivity(row: ActivityWithRelations) {
  const primaryTag =
    row.animal.identifiers?.find((i) => i.isPrimary)?.identifierValue ??
    row.animal.animalNumber;
  return {
    id: row.id,
    animalId: row.animalId,
    animalTag: primaryTag,
    animalName: row.animal.name ?? row.animal.animalNumber,
    species: row.animal.species,
    imageUrl: row.animal.imageUrl,
    farmId: row.farmId,
    farmName: row.farm.name,
    activityType: row.activityType,
    activityDate: row.activityDate.toISOString().split('T')[0],
    activityTime: row.activityTime,
    session: row.session,
    status: row.status,
    notes: row.notes,
    recordedBy: `${row.recordedBy.firstName} ${row.recordedBy.lastName}`,
    createdAt: row.createdAt.toISOString(),
    // Feeding
    feedType: row.feedType,
    feedName: row.feedName,
    quantity: row.quantity,
    unit: row.unit,
    feedingMethod: row.feedingMethod,
    // Weight
    weightKg: row.weightKg,
    // Health
    observation: row.observation,
    temperature: row.temperature,
    healthStatus: row.healthStatus,
    symptoms: row.symptoms,
    requiresVet: row.requiresVet,
  };
}

export function shapeTransfer(row: TransferWithRelations) {
  const primaryTag =
    row.animal.identifiers?.find((i) => i.isPrimary)?.identifierValue ??
    row.animal.animalNumber;
  return {
    id: row.id,
    animalId: row.animalId,
    animalTag: primaryTag,
    animalName: row.animal.name ?? row.animal.animalNumber,
    species: row.animal.species,
    imageUrl: row.animal.imageUrl,
    animalHealthStatus: undefined as string | undefined,
    animalIsDeceased: row.animal.status === 'DECEASED',
    animalIsQuarantined: row.animal.status === 'QUARANTINED',
    fromFarmId: row.fromFarmId,
    fromFarmName: row.fromFarm.name,
    toFarmId: row.toFarmId,
    toFarmName: row.toFarm.name,
    departureDate: row.departureDate.toISOString().split('T')[0],
    departureTime: row.departureTime,
    expectedArrivalDate: row.expectedArrivalDate.toISOString().split('T')[0],
    expectedArrivalTime: row.expectedArrivalTime,
    actualArrivalDate: row.actualArrivalDate?.toISOString().split('T')[0],
    actualArrivalTime: row.actualArrivalTime,
    reason: row.reason,
    status: row.status,
    vehicleNumber: row.vehicleNumber,
    driverName: row.driverName,
    driverContact: row.driverContact,
    notes: row.notes,
    recordedBy: `${row.recordedBy.firstName} ${row.recordedBy.lastName}`,
    createdAt: row.createdAt.toISOString(),
  };
}
