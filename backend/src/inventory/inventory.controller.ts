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
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('materials')
  createMaterial(@Body() dto: CreateMaterialDto, @CurrentUser() user: any) {
    return this.inventoryService.createMaterial(dto, Number(user.sub));
  }

  @Get('companies/:companyId/materials')
  findMaterials(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.inventoryService.findMaterials(companyId);
  }

  @Get('materials/:id')
  findMaterial(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findMaterial(id);
  }

  @Patch('materials/:id')
  updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.updateMaterial(id, dto, Number(user.sub));
  }

  @Post('transactions')
  createTransaction(
    @Body() dto: CreateInventoryTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createTransaction(dto, Number(user.sub));
  }

  @Get('projects/:projectId/transactions')
  findTransactionsByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.inventoryService.findTransactionsByProject(projectId);
  }

  @Get('materials/:materialId/transactions')
  findTransactionsByMaterial(
    @Param('materialId', ParseIntPipe) materialId: number,
  ) {
    return this.inventoryService.findTransactionsByMaterial(materialId);
  }

  @Get('projects/:projectId/stock')
  getProjectStock(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.inventoryService.getProjectStock(projectId);
  }
}