/* eslint-disable max-len */
const {MessageEmbed} = require('discord.js');
const request = require('request');
const config = require('../config.json');
const logger = require('../main');

module.exports = {
  name: 'players',
  description: 'Displays the number of players.',
  async execute(message, args, client) {
    const embed = new MessageEmbed()
        .setTitle('Server Monitor')
        .setColor(4437377)
        .setDescription(`Currently monitoring ${config.requesturl}`)
        .addField('Player Count', 0);

    await request(config.requesturl, async(error, response, body) => {
      if (error) {
        logger.logger.log('error', error);
      }
      logger.logger.log('info', `Response code: ${response.statusCode}`);
      const data = JSON.parse(body);
      embed
          .spliceFields(0, 1, {name: 'Player Count', value: data.length, inline: true});

      message.reply(embed);
    });
  },
};
