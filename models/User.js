const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  score: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
});

module.exports = mongoose.model('User', userSchema);
