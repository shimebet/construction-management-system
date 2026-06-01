import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactDto) {
    return this.prisma.contactInquiry.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        company: dto.company ?? null,
        subject: dto.subject ?? null,
        message: dto.message,
      },
    });
  }

  findAll() {
    return this.prisma.contactInquiry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}