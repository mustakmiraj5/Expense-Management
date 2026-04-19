import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    expense: {
      count: jest.fn(),
    },
  };

  const mockCategory = {
    id: 1,
    name: 'Food',
    icon: '🍽️',
    color: '#F97316',
    isDefault: false,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories for the user sorted by isDefault desc, name asc', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll(1);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('create', () => {
    const dto = { name: 'Transport', icon: '🚌', color: '#3B82F6' };

    it('should create and return a new category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ ...mockCategory, ...dto });

      const result = await service.create(1, dto);

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 1 },
      });
      expect(result.name).toBe('Transport');
    });

    it('should throw ConflictException when category name already exists for user', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.create(1, dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the category', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      const updated = { ...mockCategory, name: 'Transport' };
      mockPrisma.category.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, { name: 'Transport' });

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Transport' },
      });
      expect(result.name).toBe('Transport');
    });

    it('should throw NotFoundException when category not found for user', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.update(1, 999, { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete category and return success message', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.expense.count.mockResolvedValue(0);
      mockPrisma.category.delete.mockResolvedValue(mockCategory);

      const result = await service.remove(1, 1);

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.message).toContain('deleted');
    });

    it('should throw ConflictException when category is in use by expenses', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.expense.count.mockResolvedValue(3);

      await expect(service.remove(1, 1)).rejects.toThrow(ConflictException);
      expect(mockPrisma.category.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category does not belong to user', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
