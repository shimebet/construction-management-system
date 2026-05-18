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
import { QualityService } from './quality.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { CreateNcrDto } from './dto/create-ncr.dto';
import { UpdateNcrDto } from './dto/update-ncr.dto';

@Controller('quality')
@UseGuards(JwtAuthGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post('checklists')
  createChecklist(@Body() dto: CreateChecklistDto, @CurrentUser() user: any) {
    return this.qualityService.createChecklist(dto, Number(user.sub));
  }

  @Get('projects/:projectId/checklists')
  findChecklists(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.qualityService.findChecklists(projectId);
  }

  @Patch('checklists/:id')
  updateChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecklistDto,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.updateChecklist(id, dto, Number(user.sub));
  }

  @Post('inspections')
  createInspection(@Body() dto: CreateInspectionDto, @CurrentUser() user: any) {
    return this.qualityService.createInspection(dto, Number(user.sub));
  }

  @Get('projects/:projectId/inspections')
  findInspections(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.qualityService.findInspections(projectId);
  }

  @Patch('inspections/:id')
  updateInspection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInspectionDto,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.updateInspection(id, dto, Number(user.sub));
  }

  @Post('ncrs')
  createNcr(@Body() dto: CreateNcrDto, @CurrentUser() user: any) {
    return this.qualityService.createNcr(dto, Number(user.sub));
  }

  @Get('projects/:projectId/ncrs')
  findNcrs(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.qualityService.findNcrs(projectId);
  }

  @Patch('ncrs/:id')
  updateNcr(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNcrDto,
    @CurrentUser() user: any,
  ) {
    return this.qualityService.updateNcr(id, dto, Number(user.sub));
  }
}