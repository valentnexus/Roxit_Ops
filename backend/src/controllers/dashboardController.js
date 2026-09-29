const dashboardService = require('../services/dashboardService');

exports.stats = async (_req, res) => {
  res.json(await dashboardService.stats());
};

exports.widgets = async (_req, res) => {
  res.json(await dashboardService.widgets());
};
