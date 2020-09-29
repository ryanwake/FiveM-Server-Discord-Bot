/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const {format, createLogger, transports} = require('winston');
const {combine, timestamp, label, printf} = format;
const {Client, MessageEmbed, Collection} = require('discord.js');
const request = require('request');
const config = require('./config.json');
const Keyv = require('keyv');
const fs = require('fs');
require('winston-daily-rotate-file');
const DiscordClient = new Client();
DiscordClient.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  DiscordClient.commands.set(command.name, command);
}

/* Store token in .env for dev, reads config.json if prod. */
if (config.dev) {
  require('dotenv').config();
  config.token = process.env.DISCORD_BOT_TOKEN;
  config.channel = process.env.LOG_CHANNEL;
  config.requesturl = process.env.REQUEST_URL;
  config.guildid = process.env.GUILD_ID;
  config.mysqlconnectionstring = process.env.MYSQL_CONNECTION_STRING;
  config.fivemserverurl = process.env.FIVEM_SERVER_URL;
}

const prefix = new Keyv((process.env.MYSQL_CONNECTION_STRING || config.mysqlconnectionstring), {namespace: 'prefix'});
const channel = new Keyv((process.env.MYSQL_CONNECTION_STRING || config.mysqlconnectionstring), {namespace: 'channel'});
const dbMessage = new Keyv((process.env.MYSQL_CONNECTION_STRING || config.mysqlconnectionstring), {namespace: 'message'});
const log = new Keyv((process.env.MYSQL_CONNECTION_STRING || config.mysqlconnectionstring), {namespace: 'log'});
const dataUrl = new Keyv((process.env.MYSQL_CONNECTION_STRING || config.mysqlconnectionstring), {namespace: 'url'});

const embed = new MessageEmbed()
    .setTitle('Server Monitor')
    .setColor(4437377)
    .setDescription(`Currently monitoring ${config.requesturl}`)
    .addField('Player Count', 0);

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
    new transports.DailyRotateFile({level: 'error', filename: 'error-%DATE%.log', datePattern: 'YYYY-MM-DD-HH', zippedArchive: true, maxSize: '20m', maxFiles: '5d'}),
    new transports.DailyRotateFile({level: 'warn', filename: 'warn-%DATE%.log', datePattern: 'YYYY-MM-DD-HH', zippedArchive: true, maxSize: '20m', maxFiles: '5d'}),
    new transports.DailyRotateFile({level: 'info', filename: 'info-%DATE%.log', datePattern: 'YYYY-MM-DD-HH', zippedArchive: true, maxSize: '20m', maxFiles: '5d'}),
    new transports.DailyRotateFile({level: 'debug', filename: 'debug-%DATE%.log', datePattern: 'YYYY-MM-DD-HH', zippedArchive: true, maxSize: '20m', maxFiles: '5d'}),
  ],
});

/* Log errors and warnings to console. */
DiscordClient.on('error', (error) => logger.log('error', error));
DiscordClient.on('warn', (info) => logger.log('warn', info));
DiscordClient.on('rateLimit', (rateLimitInfo) => logger.log('warn', `The bot has been rate limited, caused by ${rateLimitInfo.path}`));
process.on('unhandledRejection', (error) => logger.log('error', `Uncaught Promise Rejection: ${error}`));

/* Lets us know the bot is ready. */
DiscordClient.on('ready', async () => {
  setInterval(async () => {
    DiscordClient.guilds.cache.map(async (guild) => {
      const dataUrl = await configUrl.get(guild.id);
      const chan = await channel.get(guild.id);
      let toLog = await log.get(guild.id);
      if (toLog === null) {
        toLog = true;
      }
      if (chan && toLog && dataUrl) {
        const chanObj = guild.channels.resolve(chan);
        request(dataUrl, async (error, response, body) => {
          if (error) {
            logger.log('error', error);
          }
          logger.log('info', `Response code: ${response.statusCode}`);
          const data = JSON.parse(body);
          embed
              .spliceFields(0, 1, {name: 'Player Count', value: data.length, inline: true});
          let message = 0;
          const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
          lastMessage = await dbMessage.get(guild.id);
          if (!(lastMessage)) {
            lastMessage = 0;
          }
          const messageToEdit = await chanObj.messages.fetch(lastMessage);
          if (lastMessage !== 0) {
            embed
                .setFooter(`Last updated ${date}`);
            message = await messageToEdit.edit(embed);
          } else {
            embed
                .setFooter(`Last updated ${date}`);
            message = await chanObj.send(embed);
          }
          await dbMessage.set(guild.id, message.id);
        });
      }
    });
  }, config.updateintervalinms);
  logger.log('info', 'Bot ready and connected!');
});

DiscordClient.on('message', async (message) => {
  let setPrefix = await prefix.get(message.guild.id);
  if (!(setPrefix)) {
    setPrefix = '!';
  }
  if (!message.content.startsWith(setPrefix) || message.author.bot) return;
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  if (!DiscordClient.commands.has(commandName)) return;
  const command = DiscordClient.commands.get(commandName);
  if (command.args && !args.length) {
    let reply = `You didn't provide any args, ${message.author}`;
    if (command.usage) {
      reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``;
    }
    return message.channel.send(reply);
  }
  try {
    command.execute(message, args, DiscordClient);
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }
});

DiscordClient.login(config.token);

module.exports.logger = logger;
module.exports.prefix = prefix;
module.exports.channel = channel;
module.exports.log = log;
module.exports.url = dataUrl;
module.exports.clearLastMessage = function() {
  lastMessage = 0;
};
