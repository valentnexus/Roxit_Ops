const service = require('../services/timeInOutService');

exports.list = async (req, res) => {
  res.json(await service.list());
};

exports.summary = async (req, res) => {
  res.json(await service.summary(req.query));
};

exports.submit = async (req, res) => {
  res.json(await service.submit(req.body, req.user.name));
};

exports.update = async (req, res) => {
  res.json(await service.update({ ...req.body, logId: req.params.id }, req.user.name));
};

exports.archive = async (req, res) => {
  res.json(await service.archive(req.params.id, req.user.name));
};

exports.restore = async (req, res) => {
  res.json(await service.restore(req.params.id, req.user.name));
};
