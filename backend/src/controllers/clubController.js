const clubService = require('../services/clubService');

exports.list = async (_req, res) => {
  res.json(await clubService.list());
};

exports.create = async (req, res) => {
  // actor diambil dari token (tepercaya), bukan dari body seperti currentUser di code.gs lama
  res.json(await clubService.save({ ...req.body, clubId: undefined }, req.user.name));
};

exports.update = async (req, res) => {
  res.json(await clubService.save({ ...req.body, clubId: req.params.id }, req.user.name));
};

exports.remove = async (req, res) => {
  res.json(await clubService.remove(req.params.id, req.user.name));
};
