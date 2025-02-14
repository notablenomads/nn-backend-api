import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum LogActionType {
  // User Actions
  USER_REGISTRATION = 'user_registration',
  USER_REGISTRATION_FAILED = 'user_registration_failed',
  USER_LOGIN = 'user_login',
  USER_LOGIN_FAILED = 'user_login_failed',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_PASSWORD_RESET = 'user_password_reset',
  USER_EMAIL_VERIFIED = 'user_email_verified',

  // File Actions
  FILE_CREATE = 'file_create',
  FILE_EDIT = 'file_edit',
  FILE_DELETE = 'file_delete',
  FILE_RENAME = 'file_rename',
  FILE_MOVE = 'file_move',
  CODE_EXECUTION = 'code_execution',
  CODE_EXECUTION_ERROR = 'code_execution_error',
  CODE_COMPILATION = 'code_compilation',
  CODE_COMPILATION_ERROR = 'code_compilation_error',

  // AI Chat Actions
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED = 'chat_message_received',
  CHAT_SESSION_STARTED = 'chat_session_started',
  CHAT_SESSION_ENDED = 'chat_session_ended',
  CHAT_ERROR = 'chat_error',
  CHAT_RATE_LIMITED = 'chat_rate_limited',

  // System Actions
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  SYSTEM_CONFIG_CHANGE = 'system_config_change',
  DATABASE_ERROR = 'database_error',
  API_ERROR = 'api_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SECURITY_VIOLATION = 'security_violation',
}

@Entity('log_entries')
export class LogEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LogLevel })
  @Index()
  level: LogLevel;

  @Column({ type: 'enum', enum: LogActionType, nullable: true })
  @Index()
  actionType?: LogActionType;

  @Column({ nullable: true })
  @Index()
  userId?: string;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  stackTrace?: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @Column({ nullable: true })
  @Index()
  sessionId?: string;

  @Column({ nullable: true })
  @Index()
  requestId?: string;

  @Column({ nullable: true })
  @Index()
  correlationId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  @Index()
  environment?: string;

  @Column({ nullable: true })
  @Index()
  component?: string;

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  response?: {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: any;
  };

  @Column({ nullable: true })
  @Index()
  version?: string;
}
