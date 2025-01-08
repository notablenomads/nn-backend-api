import { Controller, Get, Query, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { IBlogPostResponse } from './interfaces/blog.interface';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  private readonly logger = new Logger(BlogController.name);
  constructor(private readonly blogService: BlogService) {}

  @Get('posts')
  @ApiOperation({ summary: 'Get team blog posts from Medium' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Blog posts retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch blog posts',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of posts per page',
  })
  async getBlogPosts(@Query('page') page: number = 1, @Query('limit') limit: number = 10): Promise<IBlogPostResponse> {
    try {
      const { posts, total } = await this.blogService.getBlogPosts(page, limit);

      return {
        posts,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error fetching blog posts:', error.stack);
      throw new HttpException('Failed to fetch blog posts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
