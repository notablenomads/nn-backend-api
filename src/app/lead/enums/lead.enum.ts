export enum ServiceType {
  WEB_APP = 'WEB_APP',
  MOBILE_APP = 'MOBILE_APP',
  AI_ML = 'AI_ML',
  DEVOPS = 'DEVOPS',
  ARCHITECTURE = 'ARCHITECTURE',
  OTHER = 'OTHER',
}

export enum ProjectType {
  NEW = 'NEW',
  EXISTING = 'EXISTING',
}

export enum ExistingProjectChallenge {
  PERFORMANCE = 'PERFORMANCE',
  SCALABILITY = 'SCALABILITY',
  BUGS = 'BUGS',
  UX = 'UX',
  SECURITY = 'SECURITY',
  MAINTENANCE = 'MAINTENANCE',
  TECHNICAL_DEBT = 'TECHNICAL_DEBT',
  OUTDATED = 'OUTDATED',
  OTHER = 'OTHER',
}

export enum TargetAudience {
  CONSUMERS = 'CONSUMERS',
  BUSINESSES = 'BUSINESSES',
  BOTH = 'BOTH',
}

export enum Industry {
  ECOMMERCE = 'ECOMMERCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  SAAS = 'SAAS',
  FINANCE = 'FINANCE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER',
}

export enum DesignStyle {
  MODERN = 'MODERN',
  BOLD = 'BOLD',
  PROFESSIONAL = 'PROFESSIONAL',
  UNDECIDED = 'UNDECIDED',
}

export enum Timeline {
  LESS_THAN_3_MONTHS = 'LESS_THAN_3_MONTHS',
  THREE_TO_SIX_MONTHS = 'THREE_TO_SIX_MONTHS',
  MORE_THAN_6_MONTHS = 'MORE_THAN_6_MONTHS',
  FLEXIBLE = 'FLEXIBLE',
}

export enum Budget {
  LESS_THAN_10K = 'LESS_THAN_10K',
  TEN_TO_FIFTY_K = 'TEN_TO_FIFTY_K',
  FIFTY_TO_HUNDRED_K = 'FIFTY_TO_HUNDRED_K',
  MORE_THAN_100K = 'MORE_THAN_100K',
  NOT_SURE = 'NOT_SURE',
}

export enum ContactMethod {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
}

export enum MobileAppPlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  BOTH = 'BOTH',
}

export enum AIMLDatasetStatus {
  YES = 'YES',
  NO = 'NO',
  NOT_SURE = 'NOT_SURE',
}

export enum TechnicalExpertise {
  TECHNICAL = 'TECHNICAL',
  NON_TECHNICAL = 'NON_TECHNICAL',
}

export enum TechnicalFeature {
  // User & Security
  AUTHENTICATION = 'AUTHENTICATION', // Login, signup, password reset
  USER_MANAGEMENT = 'USER_MANAGEMENT', // User roles, profiles, permissions
  SOCIAL_LOGIN = 'SOCIAL_LOGIN', // OAuth with Google, Facebook, etc.

  // Core Features
  FILE_HANDLING = 'FILE_HANDLING', // File upload, storage, processing
  SEARCH_FILTER = 'SEARCH_FILTER', // Search, filtering, sorting
  NOTIFICATIONS = 'NOTIFICATIONS', // Email, push, in-app notifications
  ADMIN_PANEL = 'ADMIN_PANEL', // Administrative dashboard and controls

  // Business Features
  PAYMENTS = 'PAYMENTS', // Payment processing and subscriptions
  ANALYTICS = 'ANALYTICS', // Reporting and data visualization
  MESSAGING = 'MESSAGING', // Chat and communication features
  CALENDAR = 'CALENDAR', // Scheduling and calendar management

  // Growth Features
  SEO_OPTIMIZATION = 'SEO_OPTIMIZATION', // Search engine optimization features
  SOCIAL_SHARING = 'SOCIAL_SHARING', // Social media integration
  REFERRAL_SYSTEM = 'REFERRAL_SYSTEM', // User referral and rewards
  MARKETING_TOOLS = 'MARKETING_TOOLS', // Email marketing, campaigns, automation

  // E-commerce
  SHOPPING_CART = 'SHOPPING_CART', // Cart and checkout process
  INVENTORY = 'INVENTORY', // Stock and inventory management
  ORDER_MANAGEMENT = 'ORDER_MANAGEMENT', // Order processing and tracking
  PRODUCT_MANAGEMENT = 'PRODUCT_MANAGEMENT', // Product catalog and variants

  // Integration & Performance
  API_INTEGRATION = 'API_INTEGRATION', // Third-party API connections
  MOBILE_SYNC = 'MOBILE_SYNC', // Mobile app synchronization
  ANALYTICS_TRACKING = 'ANALYTICS_TRACKING', // Google Analytics, etc.
  OFFLINE_MODE = 'OFFLINE_MODE', // Offline functionality and sync
}
