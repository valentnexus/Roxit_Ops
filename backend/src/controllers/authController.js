const authService = require('../services/authService');

exports.login = async (req, res) => {
  res.json(await authService.login(req.body.email, req.body.password));
};

exports.logout = async (req, res) => {
  res.json(await authService.logout(req.user));
};

exports.me = (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.changePassword = async (req, res) => {
  res.json(await authService.changePassword(req.user, req.body.currentPassword, req.body.newPassword));
};
