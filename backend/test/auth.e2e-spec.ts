import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { HttpExceptionFilter } from '../src/exceptions/http-exception.filter';
import * as bcrypt from 'bcrypt';

/**
 * Full auth E2E flow with a mocked PrismaService.
 * Tests register → login → access protected route → refresh → logout.
 */
describe('Auth E2E', () => {
  let app: INestApplication<App>;

  const hashedPassword = bcrypt.hashSync('password123', 10);

  const mockUser = {
    id: 1,
    email: 'e2e@example.com',
    password: hashedPassword,
    firstName: 'E2E',
    lastName: 'Test',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 9 }),
    },
    expense: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    income: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');

    const loggerInstance = app.get(Logger);
    app.useGlobalFilters(new HttpExceptionFilter(loggerInstance));
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.expense.findMany.mockResolvedValue([]);
    mockPrisma.expense.count.mockResolvedValue(0);
    mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });
    mockPrisma.expense.groupBy.mockResolvedValue([]);
    mockPrisma.income.findMany.mockResolvedValue([]);
    mockPrisma.income.count.mockResolvedValue(0);
    mockPrisma.income.aggregate.mockResolvedValue({ _sum: { amount: null } });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          category: { createMany: jest.fn().mockResolvedValue({ count: 9 }) },
        };
        return cb(tx);
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
          firstName: 'E2E',
          lastName: 'Test',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user.email).toBe('e2e@example.com');
    });

    it('should return 409 when email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
          firstName: 'E2E',
          lastName: 'Test',
        });

      expect(res.status).toBe(409);
    });

    it('should return 400 on invalid body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'bad-email', password: 'short' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 on wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should return 401 when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('Protected route with JWT', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'password123' });

      accessToken = loginRes.body.data.accessToken;
      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should access protected route with valid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('Logged out');
    });

    it('should return 401 when accessing protected route without token', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/logout');

      expect(res.status).toBe(401);
    });

    it('should return 401 when token is malformed', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return a new accessToken with a valid refresh token', async () => {
      // Login first to get a real refresh token signed with the test JWT secret
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'password123' });

      const { refreshToken } = loginRes.body.data;

      // Now use it to refresh
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 on invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'completely-invalid-token' });

      expect(res.status).toBe(401);
    });
  });
});
