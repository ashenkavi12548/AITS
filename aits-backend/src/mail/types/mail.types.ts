export interface SendVerificationEmailOptions {
  to: string;
  firstName: string;
  token: string;
  otp?: string;
}

export interface SendEmployeeWelcomeOptions {
  to: string;
  firstName: string;
  farmName: string;
  role: string;
  temporaryPassword?: string;
  loginUrl?: string;
}

export interface SendPasswordResetOptions {
  to: string;
  firstName: string;
  resetToken: string;
  resetUrl?: string;
}

export interface SendScheduleAlertOptions {
  to: string;
  recipientName: string;
  eventTitle: string;
  eventType: string;
  animalNumber: string;
  animalSpecies?: string;
  animalBreed?: string;
  scheduledDate: string | Date;
  farmName?: string;
  notes?: string;
  doseOrMedication?: string;
  actionUrl?: string;
}
