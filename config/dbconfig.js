const sql = require('mysql')
require('dotenv').config()


const pool = sql.createPool({
    // connectionLimit: 10,
    connectionLimit : 1000,
    connectTimeout  : 60 * 60 * 1000,
    acquireTimeout  : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,
    port:3306,
    host: process.env.HOST,
    user: process.env.USER_NAME,
    password: process.env.PASSWORD,
    database: process.env.DB,
})

module.exports = pool