import { Injectable, BadRequestException } from '@nestjs/common';
import { Animal, AnimalGender, AnimalStatus } from '@prisma/client';

@Injectable()
export class AnimalBusinessRulesService {
  /**
   * General check to ensure an animal is active/eligible for new operational records.
   */
  public validateActiveStatus(animal: Animal, operation: string) {
    if (animal.status === AnimalStatus.SOLD) {
      throw new BadRequestException({
        message: `${operation.charAt(0).toUpperCase() + operation.slice(1)} cannot be recorded for a sold animal.`,
        code: 'ANIMAL_SOLD',
      });
    }

    const ineligibleStatuses: AnimalStatus[] = [
      AnimalStatus.DECEASED,
      AnimalStatus.TRANSFERRED,
      AnimalStatus.MISSING,
    ];

    if (ineligibleStatuses.includes(animal.status)) {
      throw new BadRequestException({
        message: `This animal is not active and cannot receive a new ${operation} record.`,
        code: 'ANIMAL_INACTIVE',
      });
    }
  }

  /**
   * General check for date timelines (record date >= birth date).
   */
  public validateTimeline(animal: Animal, recordDate: Date) {
    if (recordDate.getTime() < animal.dateOfBirth.getTime()) {
      throw new BadRequestException({
        message:
          "The record date cannot be earlier than the animal's date of birth.",
        code: 'INVALID_TIMELINE_DATE',
      });
    }
  }

  // --- Milk Production ---
  public validateMilkEligibility(animal: Animal, recordDate: Date) {
    if (animal.gender !== AnimalGender.FEMALE) {
      throw new BadRequestException({
        message:
          'Milk production can only be recorded for eligible female animals.',
        code: 'MILK_PRODUCTION_INVALID_GENDER',
      });
    }
    if (animal.status === AnimalStatus.QUARANTINED) {
      throw new BadRequestException({
        message: 'Milk cannot be recorded for this animal while quarantined.',
        code: 'ANIMAL_QUARANTINED',
      });
    }
    this.validateActiveStatus(animal, 'milk production');
    this.validateTimeline(animal, recordDate);
  }

  // --- Breeding ---
  public validateBreedingEligibility(
    sire: Animal,
    dam: Animal,
    recordDate: Date,
  ) {
    if (
      sire.gender !== AnimalGender.MALE ||
      dam.gender !== AnimalGender.FEMALE
    ) {
      throw new BadRequestException({
        message:
          'Breeding requires one eligible male and one eligible female animal.',
        code: 'BREEDING_INVALID_GENDERS',
      });
    }
    if (sire.id === dam.id) {
      throw new BadRequestException({
        message: 'Sire and dam cannot be the same animal.',
        code: 'BREEDING_SAME_ANIMAL',
      });
    }
    this.validateActiveStatus(sire, 'breeding');
    this.validateActiveStatus(dam, 'breeding');
    this.validateTimeline(sire, recordDate);
    this.validateTimeline(dam, recordDate);
  }

  // --- Pregnancy ---
  public validatePregnancyEligibility(animal: Animal, recordDate: Date) {
    if (animal.gender !== AnimalGender.FEMALE) {
      throw new BadRequestException({
        message: 'Pregnancy records can only be created for female animals.',
        code: 'PREGNANCY_INVALID_GENDER',
      });
    }
    this.validateActiveStatus(animal, 'pregnancy');
    this.validateTimeline(animal, recordDate);
  }

  // --- Calving ---
  public validateCalvingEligibility(dam: Animal, calvingDate: Date) {
    if (dam.gender !== AnimalGender.FEMALE) {
      throw new BadRequestException({
        message: 'Dam must be a female animal.',
        code: 'CALVING_INVALID_GENDER',
      });
    }
    this.validateActiveStatus(dam, 'calving');
    this.validateTimeline(dam, calvingDate);
  }

  // --- Vaccination ---
  public validateVaccinationEligibility(animal: Animal, recordDate: Date) {
    this.validateActiveStatus(animal, 'vaccination');
    this.validateTimeline(animal, recordDate);
  }

  // --- Health / Diagnosis ---
  public validateHealthEligibility(animal: Animal, recordDate: Date) {
    this.validateActiveStatus(animal, 'health');
    this.validateTimeline(animal, recordDate);
  }

  // --- Treatment ---
  public validateTreatmentEligibility(animal: Animal, recordDate: Date) {
    this.validateActiveStatus(animal, 'treatment');
    this.validateTimeline(animal, recordDate);
  }

  // --- Movement ---
  public validateMovementEligibility(animal: Animal, recordDate: Date) {
    this.validateActiveStatus(animal, 'movement');
    if (animal.status === AnimalStatus.QUARANTINED) {
      throw new BadRequestException({
        message:
          'Quarantined animals cannot be moved until veterinary clearance is issued.',
        code: 'ANIMAL_QUARANTINED',
      });
    }
    this.validateTimeline(animal, recordDate);
  }

  // --- Feeding ---
  public validateFeedingEligibility(
    animal: Animal,
    recordDate: Date,
    quantity: number,
  ) {
    this.validateActiveStatus(animal, 'feeding');
    this.validateTimeline(animal, recordDate);
    if (quantity < 0) {
      throw new BadRequestException({
        message: 'Feeding quantity cannot be negative.',
        code: 'FEEDING_NEGATIVE_QUANTITY',
      });
    }
  }
}
