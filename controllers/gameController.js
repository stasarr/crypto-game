const Level = require('../models/Level');
const User = require('../models/User');

exports.getGame = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const user = await User.findById(req.session.user._id);

  // Seviyenin en büyük numarasını almak
  const maxLevel = await Level.find().sort({ number: -1 }).limit(1); // En yüksek seviyeyi bul

  if (user.level >= maxLevel[0].number) {
    // Eğer kullanıcı en yüksek seviyeye ulaşmışsa, theEnd sayfasını renderla
    return res.render('theEnd');
  }

  const level = await Level.findOne({ number: user.level });
  if (!level) return res.send('Seviye bulunamadı');

  const progress = (user.level - 1) / 10 * 100;

  // Orijinal metni harflere ayır
  const cleanOriginal = level.originalText.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
  const cleanEncrypted = level.encryptedText.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');

  const originalLetters = cleanOriginal.split('').map((char, index) => ({
    char,
    encrypted: cleanEncrypted.charAt(index)
  }));

  const leaderboard = await User.find().sort({ score: -1 }).limit(10);

  res.render('game', {
    user,
    level,
    progress,
    clueLetters: level.clueLetters,
    originalLetters,  // Burada harfleri gönderiyoruz
    joker: 3,  // başlangıçta 3 joker
    leaderboard  
  });
};



exports.postGame = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const user = await User.findById(req.session.user._id);
  const level = await Level.findOne({ number: user.level });

  const answers = req.body.answers || [];
  const usedJokers = parseInt(req.body.usedJokers) || 0;
  const mistakes = parseInt(req.body.mistakes) || 0;

  const originalText = level.originalText.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
  const playerText = answers.join('');

  if (originalText.toLowerCase() === playerText.toLowerCase()) {
    user.level++;
    user.score += 100 - (usedJokers * 25 + mistakes * 10);
    await user.save();
    return res.json({ success: true, nextLevelUrl: '/game' });
  }

  // Hatalı harflerin indekslerini gönder
  const wrongIndices = [];
  for (let i = 0; i < originalText.length; i++) {
    if ((answers[i] || '').toLowerCase() !== originalText[i].toLowerCase()) {
      wrongIndices.push(i);
    }
  }

  res.json({ success: false, wrongIndices });
};


exports.useJoker = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Giriş yapmalısınız." });

  const user = await User.findById(req.session.user._id);
  const level = await Level.findOne({ number: user.level });
  if (!level) return res.status(404).json({ success: false, message: "Seviye bulunamadı." });

  const index = parseInt(req.body.index);
  if (isNaN(index)) return res.status(400).json({ success: false, message: "Geçersiz indeks." });

  const cleanOriginal = level.originalText.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
  const letter = cleanOriginal.charAt(index);

  if (!letter) return res.status(400).json({ success: false, message: "Bu indekste harf yok." });

  res.json({ success: true, letter });
};
