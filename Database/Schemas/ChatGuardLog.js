const { model, Schema } = require("mongoose");

let ChatGuardLog = new Schema({
  Guild: String,
  Perms: String,
  logChannel: String,
});

module.exports = model("chatguardlog", ChatGuardLog);
