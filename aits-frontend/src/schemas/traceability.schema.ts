import { z } from 'zod';

const todayStr = new Date().toISOString().split('T')[0];

export const dailyActivitySchema = z.object({
  farmId: z.string().min(1, 'Farm is required'),
  animalId: z.string().min(1, 'Animal is required'),
  activityType: z.enum([
    'FEEDING',
    'WEIGHT_CHECK',
    'HEALTH_CHECK',
    'GENERAL_OBSERVATION',
  ]),
  activityDate: z
    .string()
    .min(1, 'Date is required')
    .refine((val) => val <= todayStr, {
      message: 'Completed activity date cannot be in the future',
    }),
  activityTime: z.string().min(1, 'Time is required'),
  session: z.enum(['MORNING', 'EVENING', 'AFTERNOON', 'NIGHT']),
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']),
  notes: z.string().optional(),

  // Feeding fields
  feedType: z.string().optional(),
  feedName: z.string().optional(),
  quantity: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().positive('Quantity must be greater than zero').optional()
  ),
  unit: z.string().optional(),
  feedingMethod: z.string().optional(),

  // Weight check field
  weightKg: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().positive('Weight must be greater than 0').optional()
  ),

  // Health check fields
  observation: z.string().optional(),
  temperature: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(20).max(50, 'Unrealistic temperature').optional()
  ),
  healthStatus: z.string().optional(),
  symptoms: z.string().optional(),
  requiresVet: z.boolean().optional(),
});

export type DailyActivityFormData = z.infer<typeof dailyActivitySchema>;

export const farmMovementSchema = z.object({
  animalId: z.string().min(1, 'Animal is required'),
  fromFarmId: z.string().min(1, 'Origin farm is required'),
  toFarmId: z.string().min(1, 'Destination farm is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  expectedArrivalDate: z.string().min(1, 'Expected arrival date is required'),
  expectedArrivalTime: z.string().min(1, 'Expected arrival time is required'),
  reason: z.enum([
    'PERMANENT_TRANSFER',
    'TEMPORARY_TRANSFER',
    'VETERINARY_VISIT',
    'BREEDING_PURPOSE',
    'GRAZING',
    'SALE_OR_MARKET',
    'RETURN_TO_ORIGINAL_FARM',
    'OTHER',
  ]),
  vehicleNumber: z.string().optional(),
  healthClearanceId: z.string().optional(),
  driverName: z.string().optional(),
  driverContact: z.string().optional(),
  notes: z.string().optional(),
});

export type FarmMovementFormData = z.infer<typeof farmMovementSchema>;
