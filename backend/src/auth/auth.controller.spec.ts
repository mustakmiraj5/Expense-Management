import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: { id: 1, email: 'test@example.com', firstName: 'John', lastName: 'Doe', createdAt: new Date() },
};

const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockTokens),
  login: jest.fn().mockResolvedValue(mockTokens),
  refresh: jest.fn().mockResolvedValue({ accessToken: 'new-access-token' }),
};

class MockJwtAuthGuard {
  canActivate() {
    return true;
  }
}

describe('AuthController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
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
    mockAuthService.register.mockResolvedValue(mockTokens);
    mockAuthService.login.mockResolvedValue(mockTokens);
    mockAuthService.refresh.mockResolvedValue({ accessToken: 'new-access-token' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    const validBody = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should return 201 with tokens on valid registration', async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(mockAuthService.register).toHaveBeenCalledWith(validBody);
    });

    it('should return 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when password is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, password: 'short' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const validBody = { email: 'test@example.com', password: 'password123' };

    it('should return 200 with tokens on valid login', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(mockAuthService.login).toHaveBeenCalledWith(validBody);
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 200 with new accessToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'some-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return 400 when refreshToken is missing', async () => {
      const res = await request(app.getHttpServer()).post('/auth/refresh').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 200 with success message when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('Logged out');
    });
  });
});
