export interface IBlogAuthor {
  username: string;
  name: string;
  mediumUrl: string;
}

export interface IBlogPost {
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  url: string;
  publishedAt: Date;
  author: IBlogAuthor;
}

export interface IBlogPostResponse {
  posts: IBlogPost[];
  total: number;
  page: number;
  limit: number;
}

export interface IMediumRssFeed {
  rss: {
    channel: {
      item: Array<{
        title: string;
        'content:encoded': string;
        link: string;
        pubDate: string;
        'dc:creator': string;
        'content:encoded:image'?: string;
      }>;
    };
  };
}
