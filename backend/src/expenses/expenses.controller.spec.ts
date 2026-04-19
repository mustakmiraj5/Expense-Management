import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockExpense = {
  id: 1,
  title: 'Lunch',
  amount: 15.5,
  date: new Date('2026-04-01').toISOString(),
  categoryId: 1,
  userId: 1,
  category: { id: 1, name: 'Food', icon: '🍽️', color: '#F97316' },
};

const mockPaginatedResult = {
  data: [mockExpense],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

const mockExpensesService = {
  findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
  create: jest.fn().mockResolvedValue(mockExpense),
  findOne: jest.fn().mockResolvedValue(mockExpense),
  update: jest.fn().mockResolvedValue(mockExpense),
  remove: jest.fn().mockResolvedValue({ message: 'Expense deleted successfully' }),
};

class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };
    return true;
  }
}

class RejectAllGuard {
  canActivate() {
    return false;
  }
}

describe('ExpensesController', () => {
  let app: INestApplication<App>;

  const buildApp = async (guardClass = MockJwtAuthGuard) => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [{ provide: ExpensesService, useValue: mockExpensesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(guardClass)
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
    mockExpensesService.findAll.mockResolvedValue(mockPaginatedResult);
    mockExpensesService.create.mockResolvedValue(mockExpense);
    mockExpensesService.findOne.mockResolvedValue(mockExpense);
    mockExpensesService.update.mockResolvedValue(mockExpense);
    mockExpensesService.remove.mockResolvedValue({ message: 'Expense deleted successfully' });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  describe('GET /expenses (authenticated)', () => {
    it('should return paginated expenses', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer()).get('/expenses');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(mockExpensesService.findAll).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should pass query filters to the service', async () => {
      app = await buildApp();
      await request(app.getHttpServer())
        .get('/expenses')
        .query({ search: 'lunch', categoryId: '1', page: '2', limit: '10' });

      const queryArg = mockExpensesService.findAll.mock.calls[0][1];
      expect(queryArg.search).toBe('lunch');
      expect(queryArg.categoryId).toBe(1);
      expect(queryArg.page).toBe(2);
    });
  });

  describe('POST /expenses (authenticated)', () => {
    const validBody = { title: 'Lunch', amount: 15.5, categoryId: 1, date: '2026-04-01' };

    it('should create and return expense with status 201', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer()).post('/expenses').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(mockExpensesService.create).toHaveBeenCalledWith(1, validBody);
    });

    it('should return 400 when title is missing', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .send({ amount: 15.5, categoryId: 1, date: '2026-04-01' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when amount is negative', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .send({ ...validBody, amount: -10 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when date is not a valid date string', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .send({ ...validBody, date: 'not-a-date' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /expenses/:id (authenticated)', () => {
    it('should return a single expense', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer()).get('/expenses/1');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
      expect(mockExpensesService.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('PATCH /expenses/:id (authenticated)', () => {
    it('should update and return expense', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer())
        .patch('/expenses/1')
        .send({ title: 'Dinner' });

      expect(res.status).toBe(200);
      expect(mockExpensesService.update).toHaveBeenCalledWith(1, 1, { title: 'Dinner' });
    });
  });

  describe('DELETE /expenses/:id (authenticated)', () => {
    it('should delete expense and return message', async () => {
      app = await buildApp();
      const res = await request(app.getHttpServer()).delete('/expenses/1');

      expect(res.status).toBe(200);
      expect(mockExpensesService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
