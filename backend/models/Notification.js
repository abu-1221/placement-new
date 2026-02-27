const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database');

const Notification = sequelize.define('Notification', {
    recipientUsername: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'info', // info, success, warning, placement, test
        validate: { isIn: [['info', 'success', 'warning', 'placement', 'test']] }
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    actionUrl: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Notification;
