import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProcurementService } from './procurement.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto, @CurrentUser() user: any) {
    return this.procurementService.createSupplier(dto, Number(user.sub));
  }

  @Get('companies/:companyId/suppliers')
  findSuppliers(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.procurementService.findSuppliers(companyId);
  }

  @Patch('suppliers/:id')
  updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.updateSupplier(id, dto, Number(user.sub));
  }

  @Post('purchase-requests')
  createPurchaseRequest(
    @Body() dto: CreatePurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.createPurchaseRequest(dto, Number(user.sub));
  }

  @Get('projects/:projectId/purchase-requests')
  findPurchaseRequests(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.procurementService.findPurchaseRequests(projectId);
  }

  @Patch('purchase-requests/:id')
  updatePurchaseRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.updatePurchaseRequest(id, dto, Number(user.sub));
  }

  @Post('purchase-orders')
  createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.createPurchaseOrder(dto, Number(user.sub));
  }

  @Get('projects/:projectId/purchase-orders')
  findPurchaseOrders(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.procurementService.findPurchaseOrders(projectId);
  }

  @Patch('purchase-orders/:id')
  updatePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.updatePurchaseOrder(id, dto, Number(user.sub));
  }
}