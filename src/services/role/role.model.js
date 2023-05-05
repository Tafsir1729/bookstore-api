const { Schema, model } = require("mongoose");

const RoleSchema = Schema({
  name: {
    type: String,
    required: true,
  },
});

const Role = model("roles", RoleSchema);
module.exports = { Role };
