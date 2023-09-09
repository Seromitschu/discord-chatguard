const {
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const messageCounts = new Map();
const Spam = require("../../Database/Schemas/Spam");
const ChatGuard = require("../../Database/Schemas/ChatGuard");
const ChatGuardLog = require("../../Database/Schemas/ChatGuardLog");
const Emojis = require("../../Database/Config/Emojis.json");
const ms = require("ms");

module.exports = {
  name: "messageCreate",
  /**
   * @param {Client} client
   */
  async execute(message, client) {
    if (!message.guild) return;
    if (message.author?.bot) return;

    let requireDB = await ChatGuard.findOne({ _id: message.guild.id });
    const data = await ChatGuardLog.findOne({ Guild: message.guild.id });

    if (!data) return;
    if (!requireDB) return;
    if (requireDB.logs === false) return;
    if (requireDB.logs === true) {
      const memberPerms = data.Perms;
      const user = message.author;
      const member = message.guild.members.cache.get(user.id);

      if (member.permissions.has(memberPerms)) return;
      const guild = message.guild;
      let UserData = await Spam.findOne({
        Guild: guild.id,
        User: message.author.id,
      });

      const logChannel = client.channels.cache.get(data.logChannel);

      if (!UserData) {
        const newData = new Spam({
          Guild: guild.id,
          User: message.author.id,
          InfractionPoints: 0,
        });
        newData.save();
      }

      const e = new EmbedBuilder().setDescription(
        `${Emojis.WARN} <@${message.author.id}> is suspected of spamming.`
      );

      const maxMessageCount = 5;
      const intervalSeconds = 10;

      let messageCount = messageCounts.get(message.author.id) || 0;
      messageCount++;
      messageCounts.set(message.author.id, messageCount);

      if (messageCount > maxMessageCount) {
        try {
          await message.delete();
        } catch (err) {
          return;
        }

        setTimeout(() => {
          messageCounts.delete(message.author.id);
        }, 5000);

        message.channel.send({ embeds: [e] });

        if (!UserData) {
          const newData = new Spam({
            Guild: guild.id,
            User: message.author.id,
            InfractionPoints: 1,
          });
          newData.save();
        } else {
          const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Timeout")
              .setEmoji(`${Emojis.MUTE}`)
              .setCustomId("linktimeout")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setLabel("Kick")
              .setEmoji(`${Emojis.KICK}`)
              .setCustomId("linkkick")
              .setStyle(ButtonStyle.Danger)
          );
          const logMsg = await logChannel.send({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${Emojis.GUARD} <@${user.id}> has been warned for spamming.\n\`\`\`${message.content}\`\`\``
                )
                .setFooter({ text: `User ID: ${user.id}` })
                .setTimestamp(),
            ],
            components: [buttons],
          });

          const col = await logMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
          });

          col.on("collect", async (m) => {
            switch (m.customId) {
              case "linktimeout":
                {
                  if (
                    !m.member.permissions.has(
                      PermissionFlagsBits.ModerateMembers
                    )
                  )
                    return m.reply({
                      embeds: [
                        new EmbedBuilder().setDescription(
                          `${Emojis.WARN} ${m.user} is missing the *moderate_members* permission, please try again after you gain this permission.`
                        ),
                      ],
                      ephemeral: true,
                    });

                  if (!message.member) {
                    return m.reply({
                      embeds: [
                        new EmbedBuilder().setDescription(
                          `${Emojis.WARN} The target specified has most likely left the server.`
                        ),
                      ],
                      ephemeral: true,
                    });
                  }

                  m.reply({
                    embeds: [
                      new EmbedBuilder().setDescription(
                        `${Emojis.CHECKMARK} ${message.member} has been successfully timed out for 10 minutes.`
                      ),
                    ],
                    ephemeral: true,
                  });

                  const timeoutEmbed = new EmbedBuilder()
                    .setTitle("Timeout")
                    .setDescription(
                      `${Emojis.WARN} You have received a timeout from \`${message.guild.name}\` for spamming.`
                    )
                    .setTimestamp();

                  message.member
                    .send({
                      embeds: [timeoutEmbed],
                    })
                    .then(() => {
                      const time = ms("10m");
                      message.member.timeout(time);
                    });
                }
                break;

              case "linkkick":
                {
                  if (
                    !m.member.permissions.has(PermissionFlagsBits.KickMembers)
                  )
                    return m.reply({
                      embeds: [
                        new EmbedBuilder().setDescription(
                          `${Emojis.WARN} ${m.user} is missing the *kick_members* permission, please try again after you gain this permission.`
                        ),
                      ],
                      ephemeral: true,
                    });

                  const kickEmbed = new EmbedBuilder()
                    .setTitle("Kicked")
                    .setDescription(
                      `${Emojis.WARN} You have been kicked from \`${message.guild.name}\` for spamming.`
                    )
                    .setTimestamp();

                  if (!message.member) {
                    return m.reply({
                      embeds: [
                        new EmbedBuilder().setDescription(
                          `${Emojis.WARN} The target specified has most likely left the server.`
                        ),
                      ],
                      ephemeral: true,
                    });
                  }

                  m.reply({
                    embeds: [
                      new EmbedBuilder().setDescription(
                        `${Emojis.CHECKMARK} ${message.member} has been successfully kicked from the server.`
                      ),
                    ],
                    ephemeral: true,
                  });

                  message.member
                    .send({
                      embeds: [kickEmbed],
                    })
                    .then(() => {
                      message.member.kick({
                        reason: "Spamming.",
                      });
                    });
                }
                break;
            }
          });
        }
      }
    }
  },
};
