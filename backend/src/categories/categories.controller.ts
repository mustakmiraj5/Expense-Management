import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { RequestWithUser } from '../types/req.type';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const data = await this.categoriesService.findAll(req.user.id);
    return { data };
  }

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(req.user.id, dto);
    return { data };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(req.user.id, id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.categoriesService.remove(req.user.id, id);
    return { data };
  }
}
