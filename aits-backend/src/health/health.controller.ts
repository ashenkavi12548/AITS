import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HealthService, AnimalHealthTimelineResponse } from './health.service';
import { AnimalHealthState } from './health-state.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateDiagnosisDto,
  UpdateDiagnosisDto,
  CreateTreatmentDto,
  UpdateTreatmentDto,
  CreateVaccinationDto,
  UpdateVaccinationDto,
  CreateQuarantineDto,
  CreateClearanceDto,
  UpdateClearanceDto,
  CreateLabResultDto,
  UpdateLabResultDto,
  HealthQueryDto,
  CreateHealthCaseDto,
  UpdateHealthCaseDto,
  CreateClinicalExamDto,
  CreateRiskAssessmentDto,
  CreateExposureRecordDto,
  CreateMovementRestrictionDto,
  LiftMovementRestrictionDto,
  ReleaseQuarantineDto,
  RevokeClearanceDto,
  CreateFollowUpDto,
  CompleteFollowUpDto,
} from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Health & Veterinary Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/health', 'api/health'])
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // ─── 1. Health Overview / KPIs ──────────────────────────────────────────

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get live health dashboard KPIs and module summaries',
    description:
      'Aggregates total animals, healthy, under treatment, quarantined, critical alerts, and module counts scoped to user authorization.',
  })
  @ApiQuery({
    name: 'farmId',
    required: false,
    description: 'Filter overview by farm UUID',
  })
  @Permissions('dashboard:view', 'health:read')
  async getHealthOverview(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.healthService.getHealthOverview(userId, farmId);
  }

  // ─── 2. Diagnoses & Clinical Logs ───────────────────────────────────────

  @Get('diagnoses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List clinical diagnoses and health check records',
  })
  @Permissions('health:read')
  async getDiagnoses(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getDiagnoses(query, userId);
  }

  @Post('diagnoses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log new clinical examination diagnosis',
  })
  @Permissions('health:record')
  async createDiagnosis(
    @Body() dto: CreateDiagnosisDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createDiagnosis(dto, userId);
  }

  @Patch('diagnoses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update clinical diagnosis details',
  })
  @Permissions('health:record')
  async updateDiagnosis(
    @Param('id') id: string,
    @Body() dto: UpdateDiagnosisDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.updateDiagnosis(id, dto, userId);
  }

  @Patch('diagnoses/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark diagnosis as resolved',
  })
  @Permissions('health:record')
  async resolveDiagnosis(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.resolveDiagnosis(id, userId);
  }

  @Delete('diagnoses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a clinical diagnosis',
  })
  @Permissions('health:delete')
  async deleteDiagnosis(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.deleteDiagnosis(id, userId);
  }

  // ─── 3. Treatments & Prescriptions ─────────────────────────────────────

  @Get('treatments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List active and historical treatment prescriptions',
  })
  @Permissions('health:read')
  async getTreatments(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getTreatments(query, userId);
  }
  @Post('treatments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Prescribe medication and start treatment course',
  })
  @Permissions('health:record')
  async createTreatment(
    @Body() dto: CreateTreatmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createTreatment(dto, userId);
  }

  @Patch('treatments/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark active treatment course as completed',
  })
  @ApiParam({ name: 'id', description: 'Treatment UUID' })
  @Permissions('health:record')
  async completeTreatment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.completeTreatment(id, userId);
  }

  @Put('treatments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing treatment prescription',
  })
  @ApiParam({ name: 'id', description: 'Treatment UUID' })
  @Permissions('health:record')
  async updateTreatment(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.updateTreatment(id, dto, userId);
  }

  @Post('treatments/:id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Void an incorrectly recorded treatment',
  })
  @ApiParam({ name: 'id', description: 'Treatment UUID' })
  @Permissions('health:record')
  async voidTreatment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.voidTreatment(id, reason, userId);
  }

  // ─── 4. Vaccinations ───────────────────────────────────────────────────

  @Get('vaccinations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List animal vaccination administration logs',
  })
  @Permissions('health:read')
  async getVaccinations(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getVaccinations(query, userId);
  }

  @Get('vaccinations/programs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get vaccination programs coverage statistics',
  })
  @ApiQuery({
    name: 'farmId',
    required: false,
    description: 'Filter programs by farm UUID',
  })
  @Permissions('health:read')
  async getVaccinePrograms(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.healthService.getVaccinePrograms(userId, farmId);
  }

  @Post('vaccinations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record new vaccination administration',
  })
  @Permissions('health:record')
  async createVaccination(
    @Body() dto: CreateVaccinationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createVaccination(dto, userId);
  }

  @Patch('vaccinations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing vaccination record',
  })
  @ApiParam({ name: 'id', description: 'Vaccination record UUID' })
  @Permissions('health:record')
  async updateVaccination(
    @Param('id') id: string,
    @Body() dto: UpdateVaccinationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.updateVaccination(id, dto, userId);
  }

  // ─── 5. Quarantine & Biosecurity ───────────────────────────────────────

  @Get('quarantine')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get quarantine zones status and active isolation records',
  })
  @Permissions('health:read')
  async getQuarantineData(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getQuarantineData(query, userId);
  }

  @Post('quarantine')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Issue quarantine order and isolate animal',
  })
  @Permissions('health:record')
  async createQuarantine(
    @Body() dto: CreateQuarantineDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createQuarantine(dto, userId);
  }
  @Patch('quarantine/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release animal from quarantine and restore active herd status',
  })
  @ApiParam({ name: 'id', description: 'Quarantine record UUID' })
  @Permissions('health:record')
  async releaseQuarantine(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.releaseQuarantine(id, userId);
  }

  @Patch('quarantine/:id/extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extend quarantine period for an active record',
  })
  @ApiParam({ name: 'id', description: 'Quarantine record UUID' })
  @Permissions('health:record')
  async extendQuarantine(
    @Param('id') id: string,
    @Body() dto: { expectedRelease: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.extendQuarantine(id, dto.expectedRelease, userId);
  }

  @Delete('quarantine/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a quarantine record',
  })
  @ApiParam({ name: 'id', description: 'Quarantine record UUID' })
  @Permissions('health:delete')
  async deleteQuarantine(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.deleteQuarantine(id, userId);
  }

  // ─── 6. Health Clearances ──────────────────────────────────────────────

  @Get('clearances')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List veterinary transit and health clearance certificates',
  })
  @Permissions('health:read')
  async getClearances(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getClearances(query, userId);
  }

  @Post('clearances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request or issue new health clearance certificate',
  })
  @Permissions('health:record')
  async createClearance(
    @Body() dto: CreateClearanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createClearance(dto, userId);
  }

  @Patch('clearances/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update pending health clearance certificate',
  })
  @ApiParam({ name: 'id', description: 'Clearance certificate UUID' })
  @Permissions('health:record')
  async updateClearance(
    @Param('id') id: string,
    @Body() dto: UpdateClearanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.updateClearance(id, dto, userId);
  }

  @Patch('clearances/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve and sign health clearance certificate',
  })
  @ApiParam({ name: 'id', description: 'Clearance certificate UUID' })
  @Permissions('health:record')
  async approveClearance(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.approveClearance(id, userId);
  }

  // ─── 7. Lab Results & Diagnostics ──────────────────────────────────────

  @Get('lab-results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List laboratory test results and diagnostic reports',
  })
  @Permissions('health:read')
  async getLabResults(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getLabResults(query, userId);
  }

  @Post('lab-results')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request new laboratory test or upload diagnostic record',
  })
  @Permissions('health:record')
  async createLabResult(
    @Body() dto: CreateLabResultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createLabResult(dto, userId);
  }

  @Patch('lab-results/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update laboratory test result findings or flag status',
  })
  @ApiParam({ name: 'id', description: 'Lab result UUID' })
  @Permissions('health:record')
  async updateLabResult(
    @Param('id') id: string,
    @Body() dto: UpdateLabResultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.updateLabResult(id, dto, userId);
  }

  // ─── 8. Veterinary Master Catalogs ──────────────────────────────────────

  @Get('masters/diseases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get official veterinary disease master catalog' })
  @Permissions('health:read')
  async getDiseases() {
    return this.healthService.getDiseases();
  }

  @Get('masters/medications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get veterinary medications master catalog' })
  @Permissions('health:read')
  async getMedications() {
    return this.healthService.getMedications();
  }

  @Get('masters/lab-tests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get laboratory diagnostic test catalog' })
  @Permissions('health:read')
  async getLabTestCatalogs() {
    return this.healthService.getLabTestCatalogs();
  }

  @Get('masters/vaccine-programs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vaccination program catalog with intervals' })
  @Permissions('health:read')
  async getVaccinationPrograms(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.healthService.getVaccinationProgramCatalog(userId, farmId);
  }

  // ─── 9. Clinical Health Cases ───────────────────────────────────────────

  @Post('cases')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open new clinical health case for an animal' })
  @Permissions('health:record')
  async createHealthCase(
    @Body() dto: CreateHealthCaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createHealthCase(dto, userId);
  }

  @Get('cases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List clinical health cases' })
  @Permissions('health:read')
  async getHealthCases(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getHealthCases(query, userId);
  }

  @Get('cases/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get detailed clinical health case with all records',
  })
  @Permissions('health:read')
  async getHealthCaseById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getHealthCaseById(id, userId);
  }

  @Patch('cases/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or transition health case status' })
  @Permissions('health:record')
  async updateHealthCase(
    @Param('id') id: string,
    @Body() dto: UpdateHealthCaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.updateHealthCase(id, dto, userId);
  }

  // ─── 10. Structured Clinical Examinations ───────────────────────────────

  @Post('clinical-exams')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log structured clinical examination with vitals' })
  @Permissions('health:record')
  async createClinicalExam(
    @Body() dto: CreateClinicalExamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createClinicalExam(dto, userId);
  }

  @Get('clinical-exams')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List clinical examination logs' })
  @Permissions('health:read')
  async getClinicalExams(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getClinicalExams(query, userId);
  }

  // ─── 11. Biosecurity Risk & Contact Tracing ─────────────────────────────

  @Post('risk-assessments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record biosecurity risk assessment' })
  @Permissions('health:record')
  async createRiskAssessment(
    @Body() dto: CreateRiskAssessmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createRiskAssessment(dto, userId);
  }

  @Get('risk-assessments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List biosecurity risk assessments' })
  @Permissions('health:read')
  async getRiskAssessments(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getRiskAssessments(query, userId);
  }

  @Post('exposures')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register contact tracing / exposure event' })
  @Permissions('health:record')
  async createExposureRecord(
    @Body() dto: CreateExposureRecordDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createExposureRecord(dto, userId);
  }

  @Get('exposures/graph/:farmId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get farm epidemiological contact tracing graph' })
  @Permissions('health:read')
  async getExposureGraph(
    @Param('farmId') farmId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getExposureGraph(farmId, userId);
  }

  // ─── 12. Movement Restrictions ──────────────────────────────────────────

  @Post('movement-restrictions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Impose movement restriction on an animal' })
  @Permissions('health:record')
  async createMovementRestriction(
    @Body() dto: CreateMovementRestrictionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createMovementRestriction(dto, userId);
  }

  @Patch('movement-restrictions/:id/lift')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lift movement restriction with veterinary reason' })
  @Permissions('health:record')
  async liftMovementRestriction(
    @Param('id') id: string,
    @Body() dto: LiftMovementRestrictionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.liftMovementRestriction(id, dto, userId);
  }

  @Get('movement-restrictions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List active and historical movement restrictions' })
  @Permissions('health:read')
  async getMovementRestrictions(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getMovementRestrictions(query, userId);
  }

  // ─── 13. Food Safety & Withdrawal Periods ───────────────────────────────

  @Get('withdrawals/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List active milk and meat withdrawal periods' })
  @Permissions('health:read')
  async getActiveWithdrawals(
    @Query() query: HealthQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.getActiveWithdrawals(query, userId);
  }

  // ─── 14. Verified Quarantine Release ────────────────────────────────────

  @Post('quarantine/:id/release-verified')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release animal from quarantine with verified criteria',
  })
  @Permissions('health:record')
  async releaseQuarantineVerified(
    @Param('id') id: string,
    @Body() dto: ReleaseQuarantineDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.releaseQuarantineVerified(id, dto, userId);
  }

  // ─── 15. Health Clearance Revocation ────────────────────────────────────

  @Patch('clearances/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an issued health clearance permit' })
  @Permissions('health:record')
  async revokeClearance(
    @Param('id') id: string,
    @Body() dto: RevokeClearanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.revokeClearance(id, dto, userId);
  }

  // ─── 16. Animal Unified Health Timeline & Eligibility ───────────────────

  @Get('animals/:tagOrId/timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unified chronological animal medical history' })
  @Permissions('health:read')
  async getAnimalTimeline(
    @Param('tagOrId') tagOrId: string,
    @CurrentUser('id') userId: string,
  ): Promise<AnimalHealthTimelineResponse> {
    return this.healthService.getAnimalHealthTimeline(tagOrId, userId);
  }

  @Get('animals/:tagOrId/eligibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get authoritative animal eligibility for milk/meat/transit',
  })
  @Permissions('health:read')
  async getAnimalEligibility(
    @Param('tagOrId') tagOrId: string,
    @CurrentUser('id') userId: string,
  ): Promise<AnimalHealthState> {
    return this.healthService.getAnimalEligibility(tagOrId, userId);
  }

  // ─── 17. Surveillance & Alerts ──────────────────────────────────────────

  @Get('surveillance/outbreaks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run outbreak clustering detection' })
  @Permissions('health:read')
  async getOutbreakSurveillance(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.healthService.getOutbreakSurveillance(userId, farmId);
  }

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List active health alerts' })
  @Permissions('health:read')
  async getHealthAlerts(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.healthService.getHealthAlerts(userId, farmId);
  }

  @Patch('alerts/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark health alert resolved' })
  @Permissions('health:record')
  async resolveHealthAlert(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.resolveHealthAlert(id, userId);
  }

  // ─── 18. Veterinary Follow-Ups ──────────────────────────────────────────

  @Get('follow-ups')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List veterinary follow-ups' })
  @Permissions('health:read')
  async getFollowUps(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.healthService.getFollowUps(userId, farmId);
  }

  @Post('follow-ups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule veterinary follow-up' })
  @Permissions('health:record')
  async createFollowUp(
    @Body() dto: CreateFollowUpDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.createFollowUp(dto, userId);
  }

  @Patch('follow-ups/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete veterinary follow-up with findings' })
  @Permissions('health:record')
  async completeFollowUp(
    @Param('id') id: string,
    @Body() dto: CompleteFollowUpDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.healthService.completeFollowUp(id, dto, userId);
  }
}
