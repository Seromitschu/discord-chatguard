const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const mongoose = require("mongoose");
const AppConfig = require("../../Database/Config/App.json");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    if (!AppConfig.DATABASE.URL) return;
    await mongoose.connect(AppConfig.DATABASE.URL || "", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (mongoose.connect) {
      console.log(
        "Successfully connect to the database. The data was checked and no problems were encountered."
      );
    }

    client.user.setPresence({
      activities: [
        { name: AppConfig.ACTIVITY.TEXT, type: ActivityType.Watching },
      ],
      status: AppConfig.ACTIVITY.STATUS,
    });

    console.log(
      "The application was successfully logged in. All commands and events were loaded without any problems."
    );
  },
};
