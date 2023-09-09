const { WebhookClient, EmbedBuilder } = require('discord.js');

module.exports = {
  handleErrors: (client, webhookUrl) => {
    const webhookClient = new WebhookClient({ url: webhookUrl });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);

      const embed = new EmbedBuilder()
        .setTitle('Uncaught Exception')
        .setDescription(`\`\`\`${err.stack || err}\`\`\``)

      webhookClient.send({ embeds: [embed] });

      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);

      const embed = new EmbedBuilder()
        .setTitle('Unhandled Rejection')
        .setDescription(`Promise: \`\`\`${promise}\`\`\`\nReason: \`\`\`${reason}\`\`\``)

      webhookClient.send({ embeds: [embed] });
    });

    process.on('warning', (warning) => {
      console.warn('Warning:', warning);

      const embed = new EmbedBuilder()
        .setTitle('Warning')
        .setDescription(`\`\`\`${warning.stack || warning}\`\`\``)

      webhookClient.send({ embeds: [embed] });
    });

    client.on('rateLimit', (rateLimitInfo) => {
      console.warn('Rate Limit:', rateLimitInfo);

      const embed = new EmbedBuilder()
        .setTitle('Rate Limit')
        .setDescription(`\`\`\`${JSON.stringify(rateLimitInfo)}\`\`\``)

      webhookClient.send({ embeds: [embed] });
    });

    client.on('error', (error) => {
      console.error('Discord.js Error:', error);

      const embed = new EmbedBuilder()
        .setTitle('Discord.js Error')
        .setDescription(`\`\`\`${error.stack || error}\`\`\``)

      webhookClient.send({ embeds: [embed] });
    });
  },
};