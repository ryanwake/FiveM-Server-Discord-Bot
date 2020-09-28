const DiscordBot = require('discord.js');
const DiscordClient = new DiscordBot.Client();
const config = require('./config.json');

if (config.dev) {
  require('dotenv').config();
}

DiscordClient.login(process.env.DISCORD_BOT_TOKEN || config.token);
