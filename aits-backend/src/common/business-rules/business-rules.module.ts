import { Global, Module } from '@nestjs/common';
import { AnimalBusinessRulesService } from './animal-business-rules.service';

@Global()
@Module({
  providers: [AnimalBusinessRulesService],
  exports: [AnimalBusinessRulesService],
})
export class BusinessRulesModule {}
