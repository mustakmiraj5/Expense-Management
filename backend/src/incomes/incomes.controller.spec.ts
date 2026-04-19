import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockIncome = {
  id: 1,
  title: 'Salary',
  amount: 3000,
  date: new Date('2026-04-01').toISOString(),
  source: 'Company',
  userId: 1,
};

const mockPaginatedResult = {
  data: [mockIncome],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

const mockIncomesService = {
  findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
  create: jest.fn().mockResolvedValue(mockIncome),
  findOne: jest.fn().mockResolvedValue(mockIncome),
  update: jest.fn().mockResolvedValue(mockIncome),
  remove: jest.fn().mockResolvedValue({ message: 'Income deleted successfully' }),
};

class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };
    return true;
  }
}

describe('IncomesController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomesController],
      providers: [{ provide: IncomesService, useValue: mockIncomesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    jest.clearAllMocks();
    mockIncomesService.findAll.mockResolvedValue(mockPaginatedResult);
    mockIncomesService.create.mockResolvedValue(mockIncome);
    mockIncomesService.findOne.mockResolvedValue(mockIncome);
    mockIncomesService.update.mockResolvedValue(mockIncome);
    mockIncomesService.remove.mockResolvedValue({ message: 'Income deleted successfully' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /incomes', () => {
    it('should return paginated incomes', async () => {
      const res = await request(app.getHttpServer()).get('/incomes');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(mockIncomesService.findAll).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should pass date range query params to the service', async () => {
      await request(app.getHttpServer())
        .get('/incomes')
        .query({ startDate: '2026-04-01', endDate: '2026-04-30' });

      const queryArg = mockIncomesService.findAll.mock.calls[0][1];
      expect(queryArg.startDate).toBe('2026-04-01');
      expect(queryArg.endDate).toBe('2026-04-30');
    });
  });

  describe('POST /incomes', () => {
    const validBody = { title: 'Salary', amount: 3000, date: '2026-04-01' };

    it('should create and return income with status 201', async () => {
      const res = await request(app.getHttpServer()).post('/incomes').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(mockIncomesService.create).toHaveBeenCalledWith(1, validBody);
    });

    it('should return 400 when amount is not positive', async () => {
      const res = await request(app.getHttpServer())
        .post('/incomes')
        .send({ ...validBody, amount: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when date is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/incomes')
        .send({ ...validBody, date: 'not-a-date' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/incomes')
        .send({ amount: 3000, date: '2026-04-01' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /incomes/:id', () => {
    it('should return a single income', async () => {
      const res = await request(app.getHttpServer()).get('/incomes/1');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
      expect(mockIncomesService.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('PATCH /incomes/:id', () => {
    it('should update and return the income', async () => {
      const res = await request(app.getHttpServer())
        .patch('/incomes/1')
        .send({ title: 'Bonus' });

      expect(res.status).toBe(200);
      expect(mockIncomesService.update).toHaveBeenCalledWith(1, 1, { title: 'Bonus' });
    });
  });

  describe('DELETE /incomes/:id', () => {
    it('should delete income and return message', async () => {
      const res = await request(app.getHttpServer()).delete('/incomes/1');

      expect(res.status).toBe(200);
      expect(mockIncomesService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
