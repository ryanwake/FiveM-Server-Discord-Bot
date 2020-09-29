/* eslint-disable max-len */
const index = require('../main');

module.exports = {
  name: 'url',
  description: 'Sets the url to get data from.',
  async execute(message, args, client) {
    console.log('called');
    const senderMember = message.guild.member(message.author);
    if (senderMember.hasPermission('ADMINISTRATOR')) {
      index.url.set(message.guild.id, args[0]);
      message.reply(`URL has been set to ${args[0]}`);
    } else {
      message.reply('you do not have permission to do this!');
    }
  },
};
