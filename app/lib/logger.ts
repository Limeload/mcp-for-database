import path from 'node:path';
import fs from 'node:fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';

/**
 * Structured JSON logger with log rotation and retention.
 * - Outputs JSON logs with timestamps and metadata
 * - Supports console logging and daily-rotating file logs
 * - Provides helper to create child logger bound to a correlationId
 */

export const CORRELATION_ID_HEADER = 'x-correlation-id';

const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');
const LOG_LEVEL =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '14d';
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '20m';

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const jsonFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.printf(info => {
    const { timestamp, level, message, ...rest } =
      info as winston.Logform.TransformableInfo & {
        timestamp: string;
        level: string;
        message: string;
      };
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...rest
    });
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: LOG_LEVEL,
    format: jsonFormat
  }),
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_MAX_FILES,
    level: LOG_LEVEL,
    format: jsonFormat
  })
];

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'mcp-for-database' },
  transports
});

export const createLoggerWithCorrelation = (
  correlationId?: string,
  extraMeta?: Record<string, unknown>
) => {
  const meta = { ...(extraMeta || {}) } as Record<string, unknown>;
  if (correlationId) {
    meta.correlationId = correlationId;
  }
  return logger.child(meta);
};

export const generateCorrelationId = () => uuidv4();

export const safeTruncate = (value: string, maxLen = 2000) =>
  value.length > maxLen ? `${value.slice(0, maxLen)}…(${value.length})` : value;
