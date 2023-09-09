const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const AppConfig = require("../../Database/Config/App.json");
const fs = require("fs");

const clientId = AppConfig.APP.CLIENTID;

module.exports = (client) => {
  client.handleCommands = async (commandFolders, path) => {
    client.commandArray = [];
    for (folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`${path}/${folder}`)
        .filter((file) => file.endsWith(".js"));
      for (const file of commandFiles) {
        const command = require(`../Commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
        client.commandArray.push(command.data.toJSON());
      }
    }

    const rest = new REST({
      version: "9",
    }).setToken(AppConfig.APP.TOKEN);
    (async () => {
      try {
        await rest.put(Routes.applicationCommands(clientId), {
          body: client.commandArray,
        });
      } catch (error) {
        console.error(error);
      }
    })();
  };
};
