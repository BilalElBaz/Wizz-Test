const { get } = require('axios');
const db = require('../models');

async function populateGames() {
  const games = await Promise.all(
    [get('https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/ios.top100.json'),
      get('https://wizz-technical-test-dev.s3.eu-west-3.amazonaws.com/android.top100.json')],
  ).then((responses) => responses.flatMap((response) => response.data).flat()
    .map((game) => (
      {
        publisherId: game.publisher_id,
        name: game.name,
        platform: game.os,
        storeId: game.app_id,
        bundleId: game.bundle_id,
        appVersion: game.version,
        isPublished: Boolean(game.release_date),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    )));

  const transaction = await db.sequelize.transaction();

  try {
    await db.Game.destroy({ where: {}, truncate: true, cascade: false, transaction });
    await db.Game.bulkCreate(games, { validate: true, transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = populateGames;
