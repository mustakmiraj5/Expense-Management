import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockContact = {
  id: 1,
  name: 'Rahim',
  phone: '0171',
  note: null,
  userId: 1,
};

const mockPaginatedResult = {
  data: [{ ...mockContact, _count: { loans: 0 } }],
  meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
};

const mockContactsService = {
  findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
  create: jest.fn().mockResolvedValue(mockContact),
  findOne: jest.fn().mockResolvedValue(mockContact),
  update: jest.fn().mockResolvedValue(mockContact),
  remove: jest.fn().mockResolvedValue({ message: 'Contact deleted successfully' }),
};

class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };
    return true;
  }
}

describe('ContactsController', () => {
  let app: INestApplication<App>;

  const buildApp = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: mockContactsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    const instance = module.createNestApplication();
    instance.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await instance.init();
    return instance;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContactsService.findAll.mockResolvedValue(mockPaginatedResult);
    mockContactsService.create.mockResolvedValue(mockContact);
    mockContactsService.findOne.mockResolvedValue(mockContact);
    mockContactsService.update.mockResolvedValue(mockContact);
    mockContactsService.remove.mockResolvedValue({ message: 'Contact deleted successfully' });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /contacts returns paginated contacts', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).get('/contacts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(mockContactsService.findAll).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('POST /contacts creates a contact', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).post('/contacts').send({ name: 'Rahim' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(mockContactsService.create).toHaveBeenCalledWith(1, { name: 'Rahim' });
  });

  it('POST /contacts returns 400 when name missing', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).post('/contacts').send({});
    expect(res.status).toBe(400);
  });

  it('PATCH /contacts/:id updates contact', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer())
      .patch('/contacts/1')
      .send({ phone: '01900' });
    expect(res.status).toBe(200);
    expect(mockContactsService.update).toHaveBeenCalledWith(1, 1, { phone: '01900' });
  });

  it('DELETE /contacts/:id deletes contact', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).delete('/contacts/1');
    expect(res.status).toBe(200);
    expect(mockContactsService.remove).toHaveBeenCalledWith(1, 1);
  });
});
