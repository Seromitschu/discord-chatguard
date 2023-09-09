const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Emoji,
} = require("discord.js");
const Emojis = require("../../../Database/Config/Emojis.json");
const AppConfig = require("../../../Database/Config/App.json");

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("Help panel."),

  async execute(interaction, client) {
    const name = "Seromitschu's Cheaters";
    const icon = `${client.user.displayAvatarURL()}`;
    const guild = interaction.guild;

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
      .setTimestamp(new Date()).setDescription(`
        ${Emojis.DOT} Welcome to \`${name}\` help panel.
        
        **${Emojis.LEAF} About ${name}**
        ${name} is a chat guard bot. It detects and warns users when they try to cheat and records this in the log channel.
        
        **${Emojis.LEAF} Setup Chat Guard**
        Type \`/setup\` and select **bypass authorisation** and **log channel**. Then press the ${Emojis.CHECKMARK} \`Activate\` button below the message you receive. Now the bot is ready!
        
        ${Emojis.WARN} You can now track the cheats that members are trying to perform through the log channel and penalise them.`);

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
