import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockProfile = {
  id: 1,
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date().toISOString(),
};

const mockUsersService = {
  getProfile: jest.fn().mockResolvedValue(mockProfile),
  updateProfile: jest.fn().mockResolvedValue(mockProfile),
  changePassword: jest.fn().mockResolvedValue({ message: 'Password updated successfully' }),
};

class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };
    return true;
  }
}

describe('UsersController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
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
    mockUsersService.getProfile.mockResolvedValue(mockProfile);
    mockUsersService.updateProfile.mockResolvedValue(mockProfile);
    mockUsersService.changePassword.mockResolvedValue({ message: 'Password updated successfully' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return the authenticated user profile', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('password');
      expect(mockUsersService.getProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update and return the profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .send({ firstName: 'Jane' });

      expect(res.status).toBe(200);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(1, { firstName: 'Jane' });
    });

    it('should return 400 when unknown fields are sent (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .send({ firstName: 'Jane', unknownField: 'value' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /users/me/password', () => {
    const validBody = { currentPassword: 'oldPass123', newPassword: 'newPass456' };

    it('should return 200 on successful password change', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('Password updated');
      expect(mockUsersService.changePassword).toHaveBeenCalledWith(1, validBody);
    });

    it('should return 400 when newPassword is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .send({ currentPassword: 'oldPass123', newPassword: 'short' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when currentPassword is missing', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me/password')
        .send({ newPassword: 'newPass456' });

      expect(res.status).toBe(400);
    });
  });
});
