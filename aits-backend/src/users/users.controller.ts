import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('farm_member:read')
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll({
      search,
      role,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Permissions('farm_member:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
