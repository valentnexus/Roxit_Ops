const roleService = require('../services/roleService');
const permissionService = require('../services/permissionService');

exports.list = async (_req, res) => {
  res.json(await roleService.list());
};

exports.create = async (req, res) => {
  res.json(await roleService.save({ ...req.body, roleId: undefined }, req.user.name));
};

exports.update = async (req, res) => {
  res.json(await roleService.save({ ...req.body, roleId: req.params.id }, req.user.name));
};

exports.remove = async (req, res) => {
  res.json(await roleService.remove(req.params.id, req.user.name));
};

exports.getPermissions = async (req, res) => {
  res.json(await permissionService.getMatrix(req.params.roleName));
};

exports.savePermissions = async (req, res) => {
  res.json(await permissionService.saveMatrix(req.params.roleName, req.body.rows, req.user.name));
};
