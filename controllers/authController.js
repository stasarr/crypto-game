const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.getLogin = (req, res) => {
  res.render('auth/login', { error: null });
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { error: null });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.render('auth/login', { error: 'Kullanıcı bulunamadı' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.render('auth/login', { error: 'Şifre yanlış' });

  req.session.user = user;
  res.redirect('/game');
};

exports.postRegister = async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.render('auth/register', { error: 'Kullanıcı adı alınmış' });

  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash });
  await user.save();
  req.session.user = user;
  res.redirect('/game');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
