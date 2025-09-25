const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');
const { get } = require('axios');
const db = require('./models');

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then((games) => res.send(games))
  .catch((err) => {
    console.log('***There was an error querying games', JSON.stringify(err));
    return res.status(400).send(err);
  }));

app.post('/api/games/search', (req, res) => {
  const { name, platform } = req.body;

  const query = {};

  if (platform && platform.trim()) query.platform = platform.trim();

  if (name && name.trim()) query.name = { [Op.like]: `%${name.trim()}%` };

  return db.Game.findAll({ where: query })
    .then((games) => res.send(games))
    .catch((err) => {
      console.log('***There was an error searching games', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.post('/api/games/populate', async (req, res) => {
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
    return res.status(201).send();
  } catch (err) {
    await transaction.rollback();
    console.log('***There was an error populating games', JSON.stringify(err));
    return res.status(400).send(err);
  }
});

app.post('/api/games', (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    .then((game) => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => game.destroy({ force: true }))
    .then(() => res.send({ id }))
    .catch((err) => {
      console.log('***Error deleting game', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          res.status(400).send(err);
        });
    });
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
