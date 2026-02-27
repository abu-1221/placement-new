const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './jmc_placement_portal.sqlite',
  logging: false, // Disable logging for cleaner console output
});

module.exports = sequelize;
