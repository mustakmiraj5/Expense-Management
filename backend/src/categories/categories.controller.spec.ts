import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockCategory = {
  id: 1,
  name: 'Food',
  icon: '🍽️',
  color: '#F97316',
  isDefault: false,
  userId: 1,
};

const mockCategoriesService = {
  findAll: jest.fn().mockResolvedValue([mockCategory]),
  create: jest.fn().mockResolvedValue(mockCategory),
  update: jest.fn().mockResolvedValue(mockCategory),
  remove: jest.fn().mockResolvedValue({ message: 'Category deleted successfully' }),
};

class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };
    return true;
  }
}

describe('CategoriesController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
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
    mockCategoriesService.findAll.mockResolvedValue([mockCategory]);
    mockCategoriesService.create.mockResolvedValue(mockCategory);
    mockCategoriesService.update.mockResolvedValue(mockCategory);
    mockCategoriesService.remove.mockResolvedValue({ message: 'Category deleted successfully' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('should return all categories for the authenticated user', async () => {
      const res = await request(app.getHttpServer()).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(mockCategoriesService.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /categories', () => {
    it('should create and return a category', async () => {
      const body = { name: 'Food', icon: '🍽️', color: '#F97316' };
      const res = await request(app.getHttpServer()).post('/categories').send(body);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(mockCategoriesService.create).toHaveBeenCalledWith(1, body);
    });

    it('should return 400 when name exceeds 50 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'A'.repeat(51) });

      expect(res.status).toBe(400);
    });

    it('should return 400 when color is not a valid hex color', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Food', color: 'not-a-hex' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .send({ icon: '🍽️', color: '#F97316' });

      expect(res.status).toBe(400);
    });

    it('should accept valid hex color', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Food', color: '#F97316' });

      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should update and return the category', async () => {
      const res = await request(app.getHttpServer())
        .patch('/categories/1')
        .send({ name: 'Groceries' });

      expect(res.status).toBe(200);
      expect(mockCategoriesService.update).toHaveBeenCalledWith(1, 1, { name: 'Groceries' });
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category and return message', async () => {
      const res = await request(app.getHttpServer()).delete('/categories/1');

      expect(res.status).toBe(200);
      expect(mockCategoriesService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
