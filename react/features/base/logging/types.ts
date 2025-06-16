export type LogLevel = 'trace' | 'log' | 'info' | 'warn' | 'error';

export interface ILoggingConfig {
    defaultLogLevel?: LogLevel;
    disableLogCollector?: boolean;
    loggers?: {
        [key: string]: LogLevel;
    };
}
