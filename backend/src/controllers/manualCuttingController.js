const service = require('../services/manualCuttingService');

exports.list = async (req, res) => {
  res.json(await service.list(req.query));
};

exports.submit = async (req, res) => {
  res.json(await service.submit(req.body, req.user.name));
};

exports.updateStatus = async (req, res) => {
  res.json(await service.updateStatus({ ...req.body, cutId: req.params.id }, req.user.name));
};
