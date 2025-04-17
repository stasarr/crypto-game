const Level = require('../models/Level');
const User = require('../models/User');

// Seviye oluşturma sayfası
exports.getCreateLevel = (req, res) => {
  if (!req.session.user || req.session.user.username !== "tavtie") return res.redirect("/game");
  res.render('admin/createLevel');
};

// Yeni seviye ekleme
const removeDiacritics = (text) => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

exports.postCreateLevel = async (req, res) => {
  const { number } = req.body;

  // Orijinal metni normalize et, sadece küçük harf yap, diakritikleri temizle
  let originalText = removeDiacritics(req.body.originalText.toLowerCase());

  // Türkçe küçük harfler (sadece sabit, güvenilir karakterler)
  const alphabet = 'abcçdefgğhıijklmnoöprsştuüvyz'.split('');

  // Türk alfabesiyle karıştırılmış şifreleme alfabesi
  const shuffledAlphabet = shuffleTurkishAlphabet(alphabet);

  // Harf eşleştirme (cipher map)
  const cipherMap = {};
  alphabet.forEach((char, i) => {
    cipherMap[char] = shuffledAlphabet[i];
  });

  // Şifreleme
  const encryptedText = originalText
    .split('')
    .map(char => cipherMap[char] || char) // Sadece alfabe içindeyse şifrele
    .join('');

  // Harf sayımı (ipucu için)
  const letterCounts = {};
  for (const char of originalText) {
    if (alphabet.includes(char)) {
      letterCounts[char] = (letterCounts[char] || 0) + 1;
    }
  }

  const clueCandidates = Object.entries(letterCounts)
    .filter(([_, count]) => count >= 2)
    .map(([char]) => char)
    .slice(0, 3);

  const clueLetters = clueCandidates.map((originalChar) => {
    const firstIndex = originalText.indexOf(originalChar);
    const encryptedChar = encryptedText[firstIndex];
    return { original: originalChar, encrypted: encryptedChar };
  });

  await Level.create({ number, originalText, encryptedText, clueLetters });
  res.redirect('/admin/levels');
};

// Güvenli karıştırma fonksiyonu
function shuffleTurkishAlphabet(alphabet) {
  const array = [...alphabet];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}



// Seviye listesi
exports.getLevelList = async (req, res) => {
  const levels = await Level.find().sort({ number: 1 });
  res.render('admin/levelList', { levels });
};

// Kullanıcı listesi
exports.getUserList = async (req, res) => {
  const users = await User.find().sort({ score: -1 });
  res.render('admin/userList', { users });
};
