/* eslint-disable max-len */
const {format, createLogger, transports} = require('winston');
const {combine, timestamp, label, printf} = format;
const DiscordBot = require('discord.js');
const DiscordClient = new DiscordBot.Client();
const config = require('./config.json');

/* Store token in .env for dev, reads config.json if prod. */
if (config.dev) {
  require('dotenv').config();
}

/* Custom logging */
const myFormat = printf(({level, message, label, timestamp}) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
      label({label: 'DiscordBot'}),
      timestamp(),
      myFormat,
  ),
  defaultMeta: {service: 'user-service'},
  transports: [
    new transports.File({filename: 'error.log', level: 'error'}),
    new transports.File({filename: 'warn.log', level: 'warn'}),
    new transports.File({filename: 'info.log', level: 'info'}),
    new transports.File({filename: 'debug.log', level: 'debug'}),
    new transports.File({filename: 'combined.log'}),
  ],
});

/* Log errors and warnings to console. */
DiscordClient.on('error', (error) => logger.log('error', error));
DiscordClient.on('warn', (info) => clogger.log('warn', info));
DiscordClient.on('rateLimit', (rateLimitInfo) => logger.log('warn', `The bot has been rate limited, caused by ${rateLimitInfo.method}`));
process.on('unhandledRejection', (error) => logger.log('error', `Uncaught Promise Rejection: ${error}`));

/* Lets us know the bot is ready. */
DiscordClient.on('ready', () => {
  logger.log('info', 'Bot ready and connected!');
});

DiscordClient.login(process.env.DISCORD_BOT_TOKEN || config.token);
