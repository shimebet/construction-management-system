import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        jobTitle: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        jobTitle: true,
        status: true,
        avatarUrl: true,
        companyUsers: {
          include: {
            company: true,
            role: true,
          },
        },
        projectUsers: {
          include: {
            project: true,
            role: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }
async create(dto: CreateUserDto) {
  const existing = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (existing) {
    throw new ConflictException('Email already exists');
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);

  return this.prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      jobTitle: dto.jobTitle,
      employeeId: dto.employeeId,
      department: dto.department,
      employmentType: dto.employmentType,
      gender: dto.gender,
      nationality: dto.nationality,
      address: dto.address,
      emergencyName: dto.emergencyName,
      emergencyPhone: dto.emergencyPhone,
      educationLevel: dto.educationLevel,
      fieldOfStudy: dto.fieldOfStudy,
      institution: dto.institution,
      graduationYear: dto.graduationYear,
      yearsExperience: dto.yearsExperience,
      previousCompany: dto.previousCompany,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      jobTitle: true,
      employeeId: true,
      department: true,
      employmentType: true,
      status: true,
    },
  });
}

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        status: dto.status as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        jobTitle: true,
        status: true,
      },
    });
  }

async remove(id: number) {
  await this.findOne(id);

  return this.prisma.user.update({
    where: { id },
    data: {
      status: 'INACTIVE' as any,
    },
  });
}
}