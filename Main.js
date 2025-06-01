const { Client, GatewayIntentBits, Collection, Events } = require(`discord.js`);
const AppConfig = require("./Database/Config/App.json");
const { handleErrors } = require('./Global/Utils/HandelErrors');
const fs = require("fs");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


///// WEBHOOK
const webhookUrl = `${AppConfig.WEBHOOK}`;
handleErrors(client, webhookUrl);

client.commands = new Collection();

{
"Hackerız diye her şeyi çalar sanıyorlar ama  ben daha çalınan kalbimi geri almasını       bilmiyorum onunkini nasıl çalayım"
} 



///// READ FUNCTIONS AND EVENTS
const functions = fs
  .readdirSync("./Global/Functions")
  .filter((file) => file.endsWith(".js"));
const eventFiles = fs
  .readdirSync("./Global/Events")
  .filter((file) => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./Global/Commands");
(async () => {
  for (file of functions) {
    require(`./Global/Functions/${file}`)(client);
  }
  client.handleEvents(eventFiles, "./Global/Events");
  client.handleCommands(commandFolders, "./Global/Commands");
  client.login(AppConfig.APP.TOKEN);
})();




/////// Made by Seromitschu Samsun/Turkey 