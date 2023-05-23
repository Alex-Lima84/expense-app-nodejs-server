"use strict";
const Pool = require('pg').Pool;
require('dotenv').config();
const pool = new Pool({
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DBPORT,
    database: process.env.DB
});
module.exports = pool;
// const pool = new Pool({
//     user: 'postgres',
//     password: 'admin',
//     host: 'localhost',
//     port: 5432,
//     database: 'todoapp'
// })