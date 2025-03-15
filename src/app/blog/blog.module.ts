import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [HttpModule, CacheModule],
  providers: [BlogService],
  controllers: [BlogController],
  exports: [BlogService],
})
export class BlogModule {}
