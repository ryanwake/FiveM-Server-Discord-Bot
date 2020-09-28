/* eslint-disable max-len */
const DiscordBot = require('discord.js');
const DiscordClient = new DiscordBot.Client();
const config = require('./config.json');

/* Store token in .env for dev, reads config.json if prod. */
if (config.dev) {
  require('dotenv').config();
}

/* Log errors and warnings to console. */
DiscordClient.on('error', (error) => console.log(`Error: ${error}`));
DiscordClient.on('warn', (info) => console.log(`Warning: ${info}`));
DiscordClient.on('rateLimit', (rateLimitInfo) => console.log(`The bot has been rate limited, caused by ${rateLimitInfo.method}`));
process.on('unhandledRejection', (error) => console.log(`Uncaught Promise Rejection: ${error}`));

/* Lets us know the bot is ready. */
DiscordClient.on('ready', () => console.log('Bot ready and connected!'));

DiscordClient.login(process.env.DISCORD_BOT_TOKEN || config.token);
