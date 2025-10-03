// src/users/users.controller.ts
import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../shared/schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('children')
  async getChildren(@Request() req) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can access this endpoint');
    }
    return this.usersService.findChildrenByParent(req.user.userId);
  }

  @Get('child/:id')
  async getChildProfile(@Param('id') id: string, @Request() req) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can access this endpoint');
    }
    return this.usersService.getChildProfile(id, req.user.userId);
  }

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }
}