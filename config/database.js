const {Sequelize} = require('sequelize');
const settings = require('../settings.json');
const axios = require('axios');

const sequelize = new Sequelize(settings.database.dbname, settings.database.user, settings.database.pass, {
    host: settings.database.host,
    dialect: 'mysql',

    logging: false,

    retry  : {
        match: [
            /ETIMEDOUT/,
            /EHOSTUNREACH/,
            /ECONNRESET/,
            /ECONNREFUSED/,
            /ETIMEDOUT/,
            /ESOCKETTIMEDOUT/,
            /EHOSTUNREACH/,
            /EPIPE/,
            /EAI_AGAIN/,
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/
        ],
        max  : 5
    },
    dialectOptions: {
        connectTimeout: 60000
    }
});

sequelize.authenticate()
    .then(async () => {
        console.log('authenticate is successful');
        // TODO uncomment for migrate database
        // await sequelize.sync({force: false, alter: true})
        // console.log('--migrate db successful--')
        // const apiToken = settings.telegram.botToken;
        // const url = 'https://api.telegram.org/bot';
        // 	await axios.post(`${url}${apiToken}/sendMessage`,
        // 		{
        // 		chat_id: -1001757967804,
        // 		text: 'migrate db successful',
        // 	})
    })
    .catch(err => {
        console.error('error=================', err);
        process.exit(-1);
    });

module.exports = sequelize;
