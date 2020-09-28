/* eslint-disable max-len */
const {format, createLogger, transports} = require('winston');
const {combine, timestamp, label, printf} = format;
const {Client, MessageEmbed, Collection} = require('discord.js');
const request = require('request');
const fs = require('fs');
const DiscordClient = new Client();
DiscordClient.commands = new Collection();
const config = require('./config.json');
let lastMessage = 0;

const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  DiscordClient.commands.set(command.name, command);
}

/* Store token in .env for dev, reads config.json if prod. */
if (config.dev) {
  require('dotenv').config();
  config.channel = process.env.LOG_CHANNEL;
  config.requesturl = process.env.REQUEST_URL;
  config.guildid = process.env.GUILD_ID;
}

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
    new transports.File({filename: 'error.log', level: 'error'}),
    new transports.File({filename: 'warn.log', level: 'warn'}),
    new transports.File({filename: 'info.log', level: 'info'}),
    new transports.File({filename: 'debug.log', level: 'debug'}),
    new transports.File({filename: 'combined.log'}),
  ],
});

/* Log errors and warnings to console. */
DiscordClient.on('error', (error) => logger.log('error', error));
DiscordClient.on('warn', (info) => logger.log('warn', info));
DiscordClient.on('rateLimit', (rateLimitInfo) => logger.log('warn', `The bot has been rate limited, caused by ${rateLimitInfo.path}`));
process.on('unhandledRejection', (error) => logger.log('error', `Uncaught Promise Rejection: ${error}`));

/* Lets us know the bot is ready. */
DiscordClient.on('ready', async () => {
  setInterval(async() => {
    await request(config.requesturl, async (error, response, body) => {
      if (error) {
        logger.log('error', error);
      }
      logger.log('info', `Response code: ${response.statusCode}`);
      const data = JSON.parse(body);
      embed
          .spliceFields(0, 1, {name: 'Player Count', value: data.length, inline: true});
      let message = 0;
      const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
      if (lastMessage) {
        embed
            .setFooter(`Last updated ${date}`);
        const chan = await DiscordClient.guilds.resolve(config.guildid).channels.resolve(config.channel);
        const editMessage = await chan.messages.fetch(lastMessage);
        message = await editMessage.edit(embed);
      } else {
        embed
            .setFooter(`Last updated ${date}`);
        message = await DiscordClient.guilds.resolve(config.guildid).channels.resolve(config.channel).send(embed);
      }
      lastMessage = message.id;
    });
  }, config.updateintervalinms);
  logger.log('info', 'Bot ready and connected!');
});

DiscordClient.on('message', async (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;
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

DiscordClient.login(process.env.DISCORD_BOT_TOKEN || config.token);

module.exports.logger = logger;
