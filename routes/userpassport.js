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
const mailers = require('../services/mailers')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './assets/uploads/passports')
    },
    filename: function (req, file, cb, next) {
      cb(null, req.user.id + '-' + file.fieldname + '-' + '' + path.extname(file.originalname))
    }
    
  })


const upload = multer({ storage: storage })


function agentsuserupload() {

    route.post('/', upload.single('passport') ,(req, res) => {
      pool.getConnection((err, con) => {
        con.query('SELECT * FROM leads WHERE id = ? ', req.user.id, (err, result) => {
          const user = result[0]
          con.query('SELECT * FROM agent WHERE agent_id = ?', user.agent_id, (err, result) => {
            const agent = result[0]
            mailers.newAgentLead(user, agent)
            req.flash("success", 'Application succesfull')
            res.redirect('/agent/dashboard')
            console.log(req.file)
          })
        })
      })
     
    })

    return route
}

module.exports = agentsuserupload()

