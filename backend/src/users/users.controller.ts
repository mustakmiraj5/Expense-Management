import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { RequestWithUser } from '../types/req.type';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    const data = await this.usersService.getProfile(req.user.id);
    return { data };
  }

  @Patch('me')
  async updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    const data = await this.usersService.updateProfile(req.user.id, dto);
    return { data };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: RequestWithUser, @Body() dto: ChangePasswordDto) {
    const data = await this.usersService.changePassword(req.user.id, dto);
    return { data };
  }
}
