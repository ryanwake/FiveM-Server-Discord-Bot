/* eslint-disable max-len */
const index = require('../main');

module.exports = {
  name: 'channel',
  description: 'Sets the channel to log to.',
  async execute(message, args, client) {
    const senderMember = message.guild.member(message.author);
    const chan = message.mentions.channels.first();
    if (senderMember.hasPermission('ADMINISTRATOR')) {
      index.clearLastMessage();
      index.channel.set(message.guild.id, chan.id);
      message.reply(`channel has been set to ${chan}`);
    } else {
      message.reply('you do not have permission to do this!');
    }
  },
};
