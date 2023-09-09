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
            `${Emojis.WARN} More than 3 emote message are not allowed in this server, ${user}.`
          );
          const emojiRegex = /<a?:.+?:\d+>|[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
          const content = msg.content.toLowerCase();
          const words = content.split(" ");
  
          if (emojiRegex.test(msg.content) && msg.content.match(emojiRegex).length > 3) {
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
                      `${Emojis.GUARD} <@${user.id}> has been warned for sending a more than 3 emote message.\n\`\`\`${msg.content}\`\`\``
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
                          `${Emojis.WARN} You have received a timeout from \`${msg.guild.name}\` for sending more than 3 emote message.`
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
                          `${Emojis.WARN} You have been kicked from \`${msg.guild.name}\` for sending more than 3 emote message.`
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
                            reason: "Sending more than 3 emote message.",
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
  