const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  // Use cloud database (e.g. Supabase Postgres) when deployed on Vercel
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Local development fallback
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './jmc_placement_portal.sqlite',
    logging: false
  });
}

module.exports = sequelize;
