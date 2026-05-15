import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CompaniesService } from './companies.service';
import { AssignCompanyUserDto } from './dto/assign-company-user.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Permissions('companies:create')
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.companiesService.create(dto, Number(user.sub));
  }

  @Get()
  @Permissions('companies:read')
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @Permissions('companies:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('companies:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.update(id, dto, Number(user.sub));
  }

  @Delete(':id')
  @Permissions('companies:delete')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.companiesService.remove(id, Number(user.sub));
  }

  @Post(':id/users')
  @Permissions('companies:update')
  assignUser(
    @Param('id', ParseIntPipe) companyId: number,
    @Body() dto: AssignCompanyUserDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.assignUser(companyId, dto, Number(user.sub));
  }

  @Get(':id/users')
  @Permissions('companies:read')
  listCompanyUsers(@Param('id', ParseIntPipe) companyId: number) {
    return this.companiesService.listCompanyUsers(companyId);
  }

  @Patch(':id/users/:userId')
  @Permissions('companies:update')
  updateCompanyUser(
    @Param('id', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateCompanyUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.companiesService.updateCompanyUser(
      companyId,
      userId,
      dto,
      Number(currentUser.sub),
    );
  }

  @Delete(':id/users/:userId')
  @Permissions('companies:update')
  removeCompanyUser(
    @Param('id', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.companiesService.removeCompanyUser(
      companyId,
      userId,
      Number(currentUser.sub),
    );
  }
}