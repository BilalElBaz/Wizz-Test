const { Op } = require('sequelize');
const db = require('../models');

function searchGames({ name, platform }) {
  const query = {};

  if (platform && platform.trim()) query.platform = platform.trim();

  if (name && name.trim()) query.name = { [Op.like]: `%${name.trim()}%` };

  return db.Game.findAll({ where: query });
}

module.exports = searchGames;
