const {
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const ChatGuard = require("../../Database/Schemas/ChatGuard");
const ChatGuardLog = require("../../Database/Schemas/ChatGuardLog");
const Emojis = require("../../Database/Config/Emojis.json");
const ms = require("ms");

module.exports = {
  name: "messageUpdate",
  /**
   * @param {Client} client
   */
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;

    let requireDB = await ChatGuard.findOne({ _id: newMessage.guild.id });
    const data = await ChatGuardLog.findOne({ Guild: newMessage.guild.id });

    if (!data) return;
    if (!requireDB) return;
    if (requireDB.logs === false) return;
    if (requireDB.logs === true) {
      const memberPerms = data.Perms;
      const user = newMessage.author;
      const member = newMessage.guild.members.cache.get(user.id);

      if (member.permissions.has(memberPerms)) return;
      else {
        const e = new EmbedBuilder().setDescription(
          `${Emojis.WARN} More than 3 mention are not allowed in this server, ${user}.`
        );
        const mentionRegex = /<@!?&?\d+>/g;
        const content = newMessage.content.toLocaleLowerCase().trim();
        const words = content.split(" ");

        if (
          mentionRegex.test(content) &&
          newMessage.content.match(mentionRegex).length >= 3
        ) {
          newMessage.delete();
          const logChannel = client.channels.cache.get(data.logChannel);
          newMessage.channel.send({ embeds: [e] });
          if (!logChannel) return;
          else {
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
                    `${Emojis.GUARD} <@${user.id}> has been warned for more than 3 mention.\n\`\`\`${newMessage.content}\`\`\``
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

                    if (!newMessage.member) {
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
                          `${Emojis.CHECKMARK} ${newMessage.member} has been successfully timed out for 10 minutes.`
                        ),
                      ],
                      ephemeral: true,
                    });

                    const timeoutEmbed = new EmbedBuilder()
                      .setTitle("Timeout")
                      .setDescription(
                        `${Emojis.WARN} You have received a timeout from \`${newMessage.guild.name}\` for more than 3 mention.`
                      )
                      .setTimestamp();

                    newMessage.member
                      .send({
                        embeds: [timeoutEmbed],
                      })
                      .then(() => {
                        const time = ms("10m");
                        newMessage.member.timeout(time);
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
                        `${Emojis.WARN} You have been kicked from \`${newMessage.guild.name}\` for more than 3 mention.`
                      )
                      .setTimestamp();

                    if (!newMessage.member) {
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
                          `${Emojis.CHECKMARK} ${newMessage.member} has been successfully kicked from the server.`
                        ),
                      ],
                      ephemeral: true,
                    });

                    newMessage.member
                      .send({
                        embeds: [kickEmbed],
                      })
                      .then(() => {
                        newMessage.member.kick({
                          reason: "Sending more than 3 mention.",
                        });
                      });
                  }
                  break;
              }
            });
          }
        }
      }
    }
  },
};
