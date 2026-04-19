import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sanitizedUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: mockUser.createdAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sanitizedUser);

      const result = await service.getProfile(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the updated profile', async () => {
      const dto = { firstName: 'Jane' };
      const updatedUser = { ...sanitizedUser, firstName: 'Jane' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(1, dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      });
      expect(result.firstName).toBe('Jane');
    });

    it('should not return password in the updated profile', async () => {
      mockPrisma.user.update.mockResolvedValue(sanitizedUser);

      const result = await service.updateProfile(1, { lastName: 'Smith' });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('changePassword', () => {
    const dto = { currentPassword: 'oldPassword123', newPassword: 'newPassword456' };

    it('should update password when current password matches', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.changePassword(1, dto);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(dto.currentPassword, mockUser.password);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(dto.newPassword, 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'new-hashed-password' },
      });
      expect(result.message).toContain('Password updated');
    });

    it('should throw BadRequestException when current password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, dto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword(999, dto)).rejects.toThrow(NotFoundException);
    });
  });
});
