module.exports = {
  name: 'channel',
  description: 'Sets the channel to log to.',
  async execute(message, args, client) {
    const sender = message.guild.member(message.author);
    if (sender.hasPermission('ADMINISTRATOR')) {
      const channel = message.mentions.channels.first();
      channel.send('This is now the channel for logs!');
    } else {
      message.reply('you do not have permissions for this.');
    }
  },
};
