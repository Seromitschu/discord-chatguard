const {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");
const ChatGuard = require("../../../Database/Schemas/ChatGuard");
const ChatGuardLog = require("../../../Database/Schemas/ChatGuardLog");
const Emojis = require("../../../Database/Config/Emojis.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("The command you need to use to set the chat guard system.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("permissions")
        .setDescription(
          "Choose the permission to bypass the chat guard system."
        )
        .setRequired(true)
        .addChoices(
          { name: "Manage Channels", value: "ManageChannels" },
          { name: "Manage Server", value: "ManageGuild" },
          { name: "Embed Links", value: "EmbedLinks" },
          { name: "Attach Files", value: "AttachFiles" },
          { name: "Manage Messages", value: "ManageMessages" },
          { name: "Administrator", value: "Administrator" }
        )
    )
    .addChannelOption((option) =>
      option
        .setName("log-channel")
        .setDescription("Choose the channel for logging violations.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),
  /**
   * @param {Client} client
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const guild = interaction.guild;
    const permissions = interaction.options.getString("permissions");
    const logChannel = interaction.options.getChannel("log-channel");

    await interaction.deferReply();

    let requireDB = await ChatGuard.findOne({ _id: guild.id });
    let logSchema = await ChatGuardLog.findOne({ Guild: guild.id });

    if (logSchema) {
      await ChatGuardLog.create({
        Guild: guild.id,
        Perms: permissions,
        logChannel: logChannel.id,
      });
    } else if (!logSchema) {
      await ChatGuardLog.create({
        Guild: guild.id,
        Perms: permissions,
        logChannel: logChannel.id,
      });
    }

    const sistema =
      requireDB?.logs === true
        ? `${Emojis.CHECKMARK} \`Activated\``
        : `${Emojis.CROSSMARK} \`Disabled\``;

    const e2 = new EmbedBuilder()
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        `**${Emojis.GUARD} Chat Guard from ${interaction.guild.name}**\n
                ${Emojis.DOT} Use the button below to configure the server's chat guard status.
                ${Emojis.DOT} The system is currently ${sistema}.\n
                ${Emojis.WARN} Bypass **permission**: \`${permissions}\`.
                ${Emojis.WARN} Current **log channel**: <#${logChannel.id}>.\n
                **${Emojis.LEAF} Guards**
                \`\`\`-> Caps Lock\n-> Character\n-> Link\n-> Mention\n-> Scam Link\n-> Swear\n-> Emote\n-> Spam\`\`\``)
      .setFooter({
        text: guild.name,
        iconURL: guild.iconURL({ dynamic: true }),
      })
      .setTimestamp(new Date());

    const b = new ButtonBuilder()
      .setLabel(`Activate`)
      .setCustomId(`true`)
      .setStyle(3)
      .setEmoji(`${Emojis.CHECKMARK}`);

    const b1 = new ButtonBuilder()
      .setLabel(`Disable`)
      .setCustomId(`false`)
      .setStyle(4)
      .setEmoji(`${Emojis.CROSSMARK}`);

    const ac = new ActionRowBuilder().addComponents(b, b1);

    const tf = await interaction.editReply({ embeds: [e2], components: [ac] });

    const coll = tf.createMessageComponentCollector();

    coll.on("collect", async (ds) => {
      if (ds.user.id !== interaction.user.id) return;

      if (ds.customId === `true`) {
        const e = new EmbedBuilder()
          .setDescription(
            `${Emojis.CHECKMARK} Chat guard system has been set to **Active**!`
          );

        ds.update({ embeds: [e], components: [] });

        await ChatGuard.findOneAndUpdate(
          { _id: guild.id },
          {
            $set: { logs: true },
          },
          { upsert: true }
        );
      } else if (ds.customId === `false`) {
        const e = new EmbedBuilder()
          .setDescription(
            `${Emojis.CROSSMARK} Chat guard system has been set to **Disabled**!`
          );

        ds.update({ embeds: [e], components: [] });

        await ChatGuard.findOneAndUpdate(
          { _id: guild.id },
          {
            $set: { logs: false },
          },
          { upsert: true }
        );
      }
    });
  },
};
