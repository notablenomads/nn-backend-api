import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { IBlogPost, IBlogAuthor, IMediumRssFeed } from './interfaces/blog.interface';
import { ERRORS } from '../core/errors/errors';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);
  private readonly authors: IBlogAuthor[];
  private readonly CACHE_TTL = 15 * 60; // 15 minutes in seconds
  private readonly CACHE_KEY = 'blog_posts';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.authors = [
      {
        username: 'mrdevx',
        name: 'Mahdi Rashidi',
        mediumUrl: 'https://mrdevx.medium.com',
      },
      {
        username: 'miladghamati',
        name: 'Milad Ghamati',
        mediumUrl: 'https://miladghamati.medium.com',
      },
    ];
  }

  async getBlogPosts(page: number = 1, limit: number = 10): Promise<{ posts: IBlogPost[]; total: number }> {
    try {
      const posts = await this.cacheService.getOrSet<IBlogPost[]>(
        this.CACHE_KEY,
        () => this.fetchAllBlogPosts(),
        this.CACHE_TTL,
      );

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = posts.slice(startIndex, endIndex);

      return {
        posts: paginatedPosts,
        total: posts.length,
      };
    } catch (error) {
      this.logger.error(ERRORS.BLOG.FETCH.FAILED({ reason: error.message }).message, error.stack);
      throw error;
    }
  }

  private async fetchAllBlogPosts(): Promise<IBlogPost[]> {
    try {
      const allPosts: IBlogPost[] = [];

      for (const author of this.authors) {
        const posts = await this.fetchMediumPosts(author);
        if (posts && posts.length > 0) {
          allPosts.push(...posts);
        }
      }

      if (allPosts.length > 0) {
        return allPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      } else {
        this.logger.warn('No blog posts were fetched from any author');
        return [];
      }
    } catch (error) {
      this.logger.error(
        ERRORS.BLOG.FETCH.FAILED({ reason: 'Failed to fetch blog posts: ' + error.message }).message,
        error.stack,
      );
      throw error;
    }
  }

  private async fetchMediumPosts(author: IBlogAuthor): Promise<IBlogPost[]> {
    try {
      const feedUrl = `${author.mediumUrl}/feed`;
      const response = await firstValueFrom(this.httpService.get(feedUrl));
      const feed = await this.parseMediumFeed(response.data);

      if (!feed?.rss?.channel?.item) {
        this.logger.warn(`No items found in feed for author ${author.username}`);
        return [];
      }

      const items = Array.isArray(feed.rss.channel.item) ? feed.rss.channel.item : [feed.rss.channel.item];

      this.logger.debug(`Found ${items.length} posts for author ${author.username}`);

      return items.map((item) => ({
        title: item.title || 'Untitled',
        content: this.cleanHtmlContent(item['content:encoded'] || ''),
        url: item.link,
        publishedAt: new Date(item.pubDate),
        imageUrl: this.extractImageUrl(item['content:encoded'] || ''),
        author: {
          username: author.username,
          name: author.name,
          mediumUrl: author.mediumUrl,
        },
      }));
    } catch (error) {
      this.logger.error(
        ERRORS.BLOG.FETCH.FAILED({ reason: `Failed to fetch posts for ${author.username}: ${error.message}` }).message,
        error.stack,
      );
      return [];
    }
  }

  private async parseMediumFeed(xmlData: string): Promise<IMediumRssFeed> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlData, { explicitArray: false }, (error, result) => {
        if (error) {
          this.logger.error(ERRORS.BLOG.PROCESSING.PARSE_ERROR({ reason: error.message }).message, error.stack);
          reject(error);
          return;
        }

        if (!result?.rss?.channel) {
          const error = new Error('Invalid RSS feed structure');
          this.logger.error(ERRORS.BLOG.PROCESSING.PARSE_ERROR({ reason: error.message }).message);
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  private cleanHtmlContent(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private extractImageUrl(html: string): string | undefined {
    if (!html) return undefined;
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : undefined;
  }

  public invalidateCache(): void {
    this.cacheService.delete(this.CACHE_KEY);
    this.logger.log('Blog posts cache invalidated');
  }
}
