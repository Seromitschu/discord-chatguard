const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Emojis = require("../../../Database/Config/Emojis.json");
const AppConfig = require("../../../Database/Config/App.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Gives some bot stats."),

  async execute(interaction, client) {
    const name = "Seromitschu's Cheaters";
    const icon = `${client.user.displayAvatarURL()}`;
    const guild = interaction.guild;

    let servercount = await client.guilds.cache.reduce(
      (a, b) => a + b.memberCount,
      0
    );
    let totalSeconds = client.uptime / 1000;
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let uptime = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds.`;
    let ping = `${Date.now() - interaction.createdTimestamp}ms.`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(`Source Code`)
        .setEmoji(`${Emojis.WEBSITE}`)
        .setStyle(ButtonStyle.Link)
        .setURL(`https://github.com/Seromitschu/discord-chatguard`),

      new ButtonBuilder()
        .setLabel(`Bot Invite`)
        .setEmoji(`${Emojis.WEBSITE}`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://discord.com/oauth2/authorize?client_id=1126556602284126340&scope=bot&permissions=0"
        )
    );

    const embed = new EmbedBuilder()
      .setAuthor({ name: name, iconURL: icon })
      .setThumbnail(`${icon}`)
      .setFooter({
        text: guild.name,
        iconURL: guild.iconURL({ dynamic: true }),
      })
      .setTimestamp(new Date())
      .addFields({
        name: `${Emojis.MEMBERS} Server Numbers`,
        value: `${client.guilds.cache.size}`,
        inline: true,
      })
      .addFields({
        name: `${Emojis.MEMBERS} Server Members`,
        value: `${servercount}`,
        inline: true,
      })
      .addFields({
        name: `${Emojis.STATS} Latency`,
        value: `${ping}`,
        inline: true,
      })
      .addFields({
        name: `${Emojis.STATS} Uptime`,
        value: `\`\`\`${uptime}\`\`\``,
      })
      .addFields({
        name: `${Emojis.OWNER} Developer`,
        value: `[\`Seromitschu\`](https://github.com/Seromitschu)`,
        inline: true,
      })
      .addFields({
        name: `${Emojis.LEAF} Project Start Date`,
        value: `\`3 September 2023\``,
        inline: true,
      });

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
