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
        allPosts.push(...posts);
      }

      this.cachedPosts = allPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      this.lastFetchTime = now;
    } catch (error) {
      this.logger.error(
        ERRORS.BLOG.FETCH.FAILED({ reason: 'Failed to update blog posts cache: ' + error.message }).message,
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

      return feed.rss.channel.item.map((item) => ({
        title: item.title,
        content: this.cleanHtmlContent(item['content:encoded']),
        url: item.link,
        publishedAt: new Date(item.pubDate),
        imageUrl: this.extractImageUrl(item['content:encoded']),
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
        } else {
          resolve(result);
        }
      });
    });
  }

  private cleanHtmlContent(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private extractImageUrl(html: string): string | undefined {
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : undefined;
  }
}
