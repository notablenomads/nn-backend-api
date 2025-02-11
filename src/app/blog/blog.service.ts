import { firstValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IBlogPost, IBlogAuthor, IMediumRssFeed } from './interfaces/blog.interface';
import { ERRORS } from '../core/errors/errors';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);
  private readonly authors: IBlogAuthor[];
  private readonly cacheTimeout = 1000 * 60 * 15; // 15 minutes
  private cachedPosts: IBlogPost[] = [];
  private lastFetchTime: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authors = [
      {
        username: 'mrdevx',
        name: 'Mahdi Rashidi',
        mediumUrl: 'https://mrdevx.medium.com',
      },
      {
        username: 'milad.ghamati',
        name: 'Milad Ghamati',
        mediumUrl: 'https://medium.com/@milad.ghamati',
      },
    ];
  }

  async getBlogPosts(page: number = 1, limit: number = 10): Promise<{ posts: IBlogPost[]; total: number }> {
    try {
      await this.updateCacheIfNeeded();

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = this.cachedPosts.slice(startIndex, endIndex);

      return {
        posts: paginatedPosts,
        total: this.cachedPosts.length,
      };
    } catch (error) {
      this.logger.error(ERRORS.BLOG.FETCH.FAILED({ reason: error.message }).message, error.stack);
      throw error;
    }
  }

  private async updateCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetchTime < this.cacheTimeout && this.cachedPosts.length > 0) {
      return;
    }

    try {
      const allPosts: IBlogPost[] = [];

      for (const author of this.authors) {
        const posts = await this.fetchMediumPosts(author);
        if (posts && posts.length > 0) {
          allPosts.push(...posts);
        }
      }

      if (allPosts.length > 0) {
        this.cachedPosts = allPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        this.lastFetchTime = now;
      } else {
        this.logger.warn('No blog posts were fetched from any author');
      }
    } catch (error) {
      this.logger.error(
        ERRORS.BLOG.FETCH.FAILED({ reason: 'Failed to update blog posts cache: ' + error.message }).message,
        error.stack,
      );
      // If we have cached posts, return them instead of throwing
      if (this.cachedPosts.length > 0) {
        this.logger.log('Returning cached posts due to fetch error');
        return;
      }
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

      return feed.rss.channel.item.map((item) => ({
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
}
