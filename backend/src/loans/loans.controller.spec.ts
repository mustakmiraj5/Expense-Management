import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockLoan = {
  id: 1,
  direction: 'LENT',
  principal: '5000',
  date: new Date('2026-04-01').toISOString(),
  dueDate: null,
  description: null,
  status: 'OPEN',
  contactId: 1,
  contact: { id: 1, name: 'Rahim', phone: null },
  repayments: [],
  outstanding: '5000',
  isOverdue: false,
};

const mockLoansService = {
  findAll: jest.fn().mockResolvedValue({
    data: [mockLoan],
    meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
  }),
  summary: jest.fn().mockResolvedValue({
    totalReceivable: '5000',
    totalPayable: '0',
    openCount: 1,
    overdueCount: 0,
  }),
  create: jest.fn().mockResolvedValue(mockLoan),
  findOne: jest.fn().mockResolvedValue(mockLoan),
  update: jest.fn().mockResolvedValue(mockLoan),
  remove: jest.fn().mockResolvedValue({ message: 'Loan deleted successfully' }),
  addRepayment: jest.fn().mockResolvedValue(mockLoan),
  removeRepayment: jest.fn().mockResolvedValue(mockLoan),
};

class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };
    return true;
  }
}

describe('LoansController', () => {
  let app: INestApplication<App>;

  const buildApp = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansController],
      providers: [{ provide: LoansService, useValue: mockLoansService }],
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
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /loans returns paginated loans', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).get('/loans');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(mockLoansService.findAll).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('GET /loans/summary returns totals', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).get('/loans/summary');
    expect(res.status).toBe(200);
    expect(res.body.data.totalReceivable).toBe('5000');
  });

  it('POST /loans creates a loan', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).post('/loans').send({
      direction: 'LENT',
      principal: 5000,
      contactId: 1,
      date: '2026-04-01',
    });
    expect(res.status).toBe(201);
    expect(mockLoansService.create).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ direction: 'LENT', principal: 5000, contactId: 1 }),
    );
  });

  it('POST /loans rejects invalid direction', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).post('/loans').send({
      direction: 'INVALID',
      principal: 100,
      contactId: 1,
      date: '2026-04-01',
    });
    expect(res.status).toBe(400);
  });

  it('POST /loans rejects negative principal', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).post('/loans').send({
      direction: 'LENT',
      principal: -10,
      contactId: 1,
      date: '2026-04-01',
    });
    expect(res.status).toBe(400);
  });

  it('POST /loans/:id/repayments adds a repayment', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer())
      .post('/loans/1/repayments')
      .send({ amount: 1000, date: '2026-04-15' });
    expect(res.status).toBe(201);
    expect(mockLoansService.addRepayment).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ amount: 1000 }),
    );
  });

  it('DELETE /loans/:id/repayments/:repaymentId removes a repayment', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).delete('/loans/1/repayments/2');
    expect(res.status).toBe(200);
    expect(mockLoansService.removeRepayment).toHaveBeenCalledWith(1, 1, 2);
  });
});
