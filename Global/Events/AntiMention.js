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
  name: "messageCreate",
  /**
   * @param {Client} client
   */
  async execute(msg, client) {
    if (!msg.guild) return;
    if (msg.author?.bot) return;

    let requireDB = await ChatGuard.findOne({ _id: msg.guild.id });
    const data = await ChatGuardLog.findOne({ Guild: msg.guild.id });

    if (!data) return;
    if (!requireDB) return;
    if (requireDB.logs === false) return;
    if (requireDB.logs === true) {
      const memberPerms = data.Perms;
      const user = msg.author;
      const member = msg.guild.members.cache.get(user.id);

      if (member.permissions.has(memberPerms)) return;
      else {
        const e = new EmbedBuilder().setDescription(
          `${Emojis.WARN} More than 3 mention are not allowed in this server, ${user}.`
        );
        const mentionRegex = /<@!?&?\d+>/g;
        const content = msg.content.toLocaleLowerCase().trim();
        const words = content.split(" ");

        if (
          mentionRegex.test(content) &&
          msg.content.match(mentionRegex).length >= 3
        ) {
          msg.delete();
          const logChannel = client.channels.cache.get(data.logChannel);
          msg.channel.send({ embeds: [e] });
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
                    `${Emojis.GUARD} <@${user.id}> has been warned for more than 3 mention.\n\`\`\`${msg.content}\`\`\``
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

                    if (!msg.member) {
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
                          `${Emojis.CHECKMARK} ${msg.member} has been successfully timed out for 10 minutes.`
                        ),
                      ],
                      ephemeral: true,
                    });

                    const timeoutEmbed = new EmbedBuilder()
                      .setTitle("Timeout")
                      .setDescription(
                        `${Emojis.WARN} You have received a timeout from \`${msg.guild.name}\` for more than 3 mention.`
                      )
                      .setTimestamp();

                    msg.member
                      .send({
                        embeds: [timeoutEmbed],
                      })
                      .then(() => {
                        const time = ms("10m");
                        msg.member.timeout(time);
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
                        `${Emojis.WARN} You have been kicked from \`${msg.guild.name}\` for more than 3 mention.`
                      )
                      .setTimestamp();

                    if (!msg.member) {
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
                          `${Emojis.CHECKMARK} ${msg.member} has been successfully kicked from the server.`
                        ),
                      ],
                      ephemeral: true,
                    });

                    msg.member
                      .send({
                        embeds: [kickEmbed],
                      })
                      .then(() => {
                        msg.member.kick({
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
