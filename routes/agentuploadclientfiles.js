const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const joi = require('joi')
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.TOKEN_SECRET);
const bcrypt = require('bcryptjs');
require('dotenv').config()
const multer = require('multer');
const jwt = require('jsonwebtoken');
const user = require('./user');
flash = require('express-flash')
var path = require('path');
const { result } = require('lodash');
const { Console } = require('console');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './assets/uploads/agent/clients')
    },
    filename: function (req, file, cb, next) {
      cb(null, req.cookies.agent_user[0] + '-' +  req.cookies.agent_user[1] + '-' + file.fieldname + '-' + '' + path.extname(file.originalname))
    }
    
  })


const upload = multer({ storage: storage })


function agentsuserupload() {
    const mscfilesupload = upload.fields([
        {name: 'bsc', maxCount: 1},
        {name: 'waec', maxCount: 1},
        {name: 'transcript', maxCount: 1},
        {name: 'passport', maxCount: 1},
        {name: 'intent', maxCount: 1},
        {name: 'other', maxCount: 1}
    ])
    route.post('/msc/:id',mscfilesupload,  (req, res) => 
    {
        const id = req.params.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE id = ? ', id, (err, result) => {
                const user = result[0]
                
            })
        })
    })

    const bscfilesupload = upload.fields([
        {name: 'waec', maxCount: 1},
        {name: 'passport', maxCount: 1},
        {name: 'other', maxCount: 1}
    ])
    route.post('/bsc/:id' , bscfilesupload,(req,res) => {
        const id = req.params.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE id = ? ', id, (err, result) => {
                const user = result[0]
    })
})
    })

    const pgdfilesupload = upload.fields([
        {name: 'waec', maxCount: 1},
        {name: 'bsc', maxCount: 1},
        {name: 'passport', maxCount: 1},
        {name: 'other', maxCount: 1}
    ])
    route.post('/pgd/:id' , pgdfilesupload,(req,res) => {
        const id = req.params.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE id = ? ', id, (err, result) => {
                const user = result[0]
    })
})
    })

    return route
}

module.exports = agentsuserupload()
