const userService = require('../services/userService');

exports.list = async (req, res) => {
  res.json(await userService.list(req.query.status));
};

exports.profile = async (req, res) => {
  res.json(await userService.getProfile(req.query.email));
};

exports.create = async (req, res) => {
  res.json(await userService.save({ ...req.body, userId: undefined }, req.user.name));
};

exports.update = async (req, res) => {
  res.json(await userService.save({ ...req.body, userId: req.params.id }, req.user.name));
};

exports.archive = async (req, res) => {
  res.json(await userService.archive(req.params.id, req.user.name));
};

exports.restore = async (req, res) => {
  res.json(await userService.restore(req.params.id, req.user.name));
};

exports.activities = async (req, res) => {
  res.json(await userService.activities(req.params.name));
};
