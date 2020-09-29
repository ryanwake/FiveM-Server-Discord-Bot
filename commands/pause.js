/* eslint-disable max-len */
const index = require('../main');

module.exports = {
  name: 'pause',
  description: 'Pauses the FiveM logging.',
  async execute(message, args, client) {
    const senderMember = message.guild.member(message.author);
    if (senderMember.hasPermission('ADMINISTRATOR')) {
      console.log(await index.log.get(message.guild.id));
      if (await index.log.get(message.guild.id)) {
        await index.log.set(message.guild.id, false);
        message.reply(`logging paused.`);
      } else {
        await index.log.set(message.guild.id, true);
        message.reply(`logging resumed.`);
      }
    } else {
      message.reply('you do not have permission to do this!');
    }
  },
};
