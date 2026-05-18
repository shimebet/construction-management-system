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
import { CostService } from './cost.service';
import { CreateBoqItemDto } from './dto/create-boq-item.dto';
import { UpdateBoqItemDto } from './dto/update-boq-item.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateVariationDto } from './dto/create-variation.dto';
import { UpdateVariationDto } from './dto/update-variation.dto';

@Controller('cost')
@UseGuards(JwtAuthGuard)
export class CostController {
  constructor(private readonly costService: CostService) {}

  @Post('boq-items')
  createBoqItem(@Body() dto: CreateBoqItemDto, @CurrentUser() user: any) {
    return this.costService.createBoqItem(dto, Number(user.sub));
  }

  @Get('projects/:projectId/boq-items')
  findBoqItems(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.costService.findBoqItems(projectId);
  }

  @Patch('boq-items/:id')
  updateBoqItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoqItemDto,
    @CurrentUser() user: any,
  ) {
    return this.costService.updateBoqItem(id, dto, Number(user.sub));
  }

  @Post('budgets')
  createBudget(@Body() dto: CreateBudgetDto, @CurrentUser() user: any) {
    return this.costService.createBudget(dto, Number(user.sub));
  }

  @Get('projects/:projectId/budgets')
  findBudgets(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.costService.findBudgets(projectId);
  }

  @Patch('budgets/:id')
  updateBudget(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: any,
  ) {
    return this.costService.updateBudget(id, dto, Number(user.sub));
  }

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.costService.createExpense(dto, Number(user.sub));
  }

  @Get('projects/:projectId/expenses')
  findExpenses(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.costService.findExpenses(projectId);
  }

  @Patch('expenses/:id')
  updateExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.costService.updateExpense(id, dto, Number(user.sub));
  }

  @Post('variations')
  createVariation(@Body() dto: CreateVariationDto, @CurrentUser() user: any) {
    return this.costService.createVariation(dto, Number(user.sub));
  }

  @Get('projects/:projectId/variations')
  findVariations(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.costService.findVariations(projectId);
  }

  @Patch('variations/:id')
  updateVariation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVariationDto,
    @CurrentUser() user: any,
  ) {
    return this.costService.updateVariation(id, dto, Number(user.sub));
  }

  @Get('projects/:projectId/summary')
  getProjectCostSummary(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.costService.getProjectCostSummary(projectId);
  }
}