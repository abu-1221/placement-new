const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database');

const PlacementDrive = sequelize.define('PlacementDrive', {
    company: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    salary: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    applyLink: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'open', // open, closed, ongoing
        validate: { isIn: [['open', 'closed', 'ongoing']] }
    },
    eligibility: {
        type: DataTypes.JSON, // { departments: [], minCgpa: 7.0, batch: [] }
        allowNull: true
    }
});

module.exports = PlacementDrive;
