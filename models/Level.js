const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  number: { type: Number, unique: true },
  originalText: { type: String, required: true },
  encryptedText: { type: String, required: true },
  clueLetters: [{ original: String, encrypted: String }]
});

module.exports = mongoose.model('Level', levelSchema);
