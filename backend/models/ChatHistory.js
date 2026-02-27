const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database');

const ChatHistory = sequelize.define('ChatHistory', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING, // user, bot
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING, // flash, pro, etc.
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
});

module.exports = ChatHistory;
