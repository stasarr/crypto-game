const Level = require('../models/Level');
const User = require('../models/User');

// Seviye oluşturma sayfası
exports.getCreateLevel = (req, res) => {
  if (!req.session.user || req.session.user.username !== "tavtie") return res.redirect("/game");
  res.render('admin/createLevel');
};

// Yeni seviye ekleme
exports.postCreateLevel = async (req, res) => {
  const { number } = req.body;

  let originalText = req.body.originalText.toLowerCase();

  // Şifreleme sadece İngilizce harfler için
  const encryptedText = originalText
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      // Sadece İngilizce harfleri şifrele
      if (char >= 'a' && char <= 'z') {
        return String.fromCharCode(((code - 97 + 1) % 26) + 97); // küçük harf
      } else if (char >= 'A' && char <= 'Z') {
        return String.fromCharCode(((code - 65 + 1) % 26) + 65); // büyük harf
      } else {
        return char; // Türkçe karakterler, noktalama vs. dokunma
      }
    })
    .join('');

  // Metindeki harflerin sayısını say ve en az iki kez geçen harfleri ipucu olarak al
  const letterCounts = {};
  for (const char of originalText) {
    if (/[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(char)) {
      letterCounts[char.toLowerCase()] = (letterCounts[char.toLowerCase()] || 0) + 1;
    }
  }

  // En az 2 kez geçen harfleri filtrele
  const clueCandidates = Object.entries(letterCounts)
    .filter(([char, count]) => count >= 2)  // sadece 2 veya daha fazla kez geçen harfler
    .map(([char]) => char)
    .slice(0, 3);  // Maksimum 3 ipucu harfi seç

  // Şifrelenmiş metinde karşılık gelen şifreli harfleri bul ve ipucunu oluştur
  const clueLetters = clueCandidates.map((originalChar) => {
    const encryptedChar = encryptedText[originalText.indexOf(originalChar)];
    return { original: originalChar, encrypted: encryptedChar };
  });

  await Level.create({ number, originalText, encryptedText, clueLetters });
  res.redirect('/admin/levels');
};


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
