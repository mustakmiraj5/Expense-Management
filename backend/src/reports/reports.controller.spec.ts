import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockCsv = '﻿Summary\r\nField,Value\r\nMonth,2026-05\r\n';

const mockReportsService = {
  generateMonthlyCsv: jest.fn().mockResolvedValue(mockCsv),
};

class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };
    return true;
  }
}

describe('ReportsController', () => {
  let app: INestApplication<App>;

  const buildApp = async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
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
    mockReportsService.generateMonthlyCsv.mockResolvedValue(mockCsv);
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /reports/monthly returns CSV with attachment headers', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).get('/reports/monthly?month=2026-05');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="expense-report-2026-05.csv"',
    );
    expect(res.text).toContain('Month,2026-05');
    expect(mockReportsService.generateMonthlyCsv).toHaveBeenCalledWith(1, '2026-05');
  });

  it('returns 400 when month is missing', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).get('/reports/monthly');
    expect(res.status).toBe(400);
  });

  it('returns 400 when month format is invalid', async () => {
    app = await buildApp();
    const res = await request(app.getHttpServer()).get('/reports/monthly?month=2026-13');
    expect(res.status).toBe(400);
  });
});
