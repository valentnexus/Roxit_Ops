const approvalService = require('../services/approvalService');

exports.list = async (_req, res) => {
  res.json(await approvalService.list());
};

exports.recent = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  res.json(await approvalService.recentProcessed(limit));
};

exports.history = async (req, res) => {
  res.json(await approvalService.recordHistory(req.params.logId));
};

exports.process = async (req, res) => {
  res.json(await approvalService.process(req.body, req.user.name));
};
