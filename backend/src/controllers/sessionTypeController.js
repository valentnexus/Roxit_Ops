const sessionTypeService = require('../services/sessionTypeService');

exports.list = async (_req, res) => {
  res.json(await sessionTypeService.list());
};

exports.create = async (req, res) => {
  res.json(await sessionTypeService.save({ ...req.body, sessionTypeId: undefined }, req.user.name));
};

exports.update = async (req, res) => {
  res.json(await sessionTypeService.save({ ...req.body, sessionTypeId: req.params.id }, req.user.name));
};

exports.remove = async (req, res) => {
  res.json(await sessionTypeService.remove(req.params.id, req.user.name));
};
