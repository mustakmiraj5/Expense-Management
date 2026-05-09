import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import type { RequestWithUser } from '../types/req.type';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser, @Query() query: QueryContactDto) {
    return this.contactsService.findAll(req.user.id, query);
  }

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateContactDto) {
    const data = await this.contactsService.create(req.user.id, dto);
    return { data };
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.contactsService.findOne(req.user.id, id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactDto,
  ) {
    const data = await this.contactsService.update(req.user.id, id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.contactsService.remove(req.user.id, id);
    return { data };
  }
}
