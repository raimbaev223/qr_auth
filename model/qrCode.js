const {Sequelize, DATE, STRING, Model, BOOLEAN, BIGINT} = require('sequelize');
const sequelize = require('../config/database');

class QRCodes extends Model { }

QRCodes.init({
    qr_id: {
        type: BIGINT(20),
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: BIGINT(20),
        allowNull: true,
        defaultValue: null,
    },
    create_date: {
        type: DATE,
    },
    is_active: {
        type: BOOLEAN,
        defaultValue: true,
    },
    qr_code: {
        type: STRING,
    },
}, {
    sequelize,
        tableName: 'qr_codes',
        timestamps: false,
});

module.exports = QRCodes;
