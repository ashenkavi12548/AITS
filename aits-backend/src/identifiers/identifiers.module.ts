import { Module } from '@nestjs/common';
import { IdentifiersService } from './identifiers.service';

@Module({
  providers: [IdentifiersService],
  exports: [IdentifiersService],
})
export class IdentifiersModule {}
