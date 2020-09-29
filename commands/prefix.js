/* eslint-disable max-len */
const index = require('../main');

module.exports = {
  name: 'prefix',
  description: 'Sets the prefix for commands.',
  async execute(message, args, client) {
    const senderMember = message.guild.member(message.author);
    if (senderMember.hasPermission('ADMINISTRATOR')) {
      index.prefix.set(message.guild.id, args[0]);
    } else {
      message.reply('you do not have permission to do this!');
    }
  },
};
