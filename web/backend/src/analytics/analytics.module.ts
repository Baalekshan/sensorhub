import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [],
  controllers: [],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {} 