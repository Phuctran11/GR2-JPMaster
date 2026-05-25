type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  context?: string;
  requestId?: string;
  userId?: number | string | null;
  [key: string]: unknown;
}

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause ? { cause: error.cause } : {}),
    };
  }
  return error;
};

const write = (level: LogLevel, message: string, context: LogContext = {}) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(payload, (_key, value) => (value instanceof Error ? serializeError(value) : value));

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
};

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
  serializeError,
};

