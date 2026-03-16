import winston from "winston";

const { combine, timestamp, colorize, label, printf, splat, errors } = winston.format;

const formatErrorCause = (cause: unknown): string => {
  if (!(cause instanceof Error)) {
    return cause ? `\ncause: ${typeof cause === "object" ? JSON.stringify(cause, undefined, 2) : cause}` : "";
  }

  const stack = cause.stack?.toString() ? `\n${cause.stack}` : "";

  return stack + formatErrorCause(cause.cause);
};

export const customFormat = combine(
  label({ label: "LOGGER" }),
  timestamp({
    format: "YY-MM-DD HH:mm:ss",
  }),
  splat(),
  errors({ stack: true, cause: true }),
  printf((info) => {
    const message = typeof info.message === "object" ? JSON.stringify(info.message, null, 2) : info.message;
    const stack = "stack" in info && info.stack?.toString() ? info.stack.toString() : "";
    const cause = "cause" in info ? formatErrorCause(info.cause) : "";

    return `[${info.label}] - ${info.timestamp} [${info.service ? info.service : "Service"}] ${info.level}: ${stack ? stack : message}${cause}`;
  }),
  colorize({ all: true }),
);

export const logger = winston.createLogger({
  level: "info",
  format: customFormat,
  transports: [new winston.transports.Console()],
  exceptionHandlers: [new winston.transports.Console()],
});

export const createServiceLogger = (service: string, meta: Record<string, string> = {}) => {
  return logger.child({ service, ...meta });
};
