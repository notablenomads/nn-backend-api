import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';

const modules = [];

@Module({
  imports: [CoreModule, ...modules],
})
export class AppModule {}
