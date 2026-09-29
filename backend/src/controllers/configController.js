const configService = require('../services/configService');
const auditService = require('../services/auditService');

exports.getConfig = async (_req, res) => {
  res.json(await configService.getConfig());
};

exports.auditTrail = async (_req, res) => {
  res.json(await auditService.list());
};
