const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const joi = require('joi')
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.TOKEN_SECRET);
const bcrypt = require('bcryptjs');
require('dotenv').config()
const multer = require('multer');
const jwt = require('jsonwebtoken')
flash = require('express-flash')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './assets/uploads')
    },
    filename: function (req, file, cb, next) {
        // console.log(req.body.document1)
        const date = new Date().getTime()
      cb(null, req.user.id + '-' + file.fieldname + '-' + date + '' + path.extname(file.originalname))
    }
    
  })


const upload = multer({ storage: storage })


function agent() {

    route.get('/', (req, res) => {
        res.redirect('/agent/dashboard')
    })
    

    route.get('/login',  (req, res) => {
        if(req.user){
            res.redirect('/agent/dashboard')
        }
        else{
        const message = req.flash()
        res.render('./agent/login', {
            message
        })
        }
    })

    route.get('/dashboard', (req, res) => {
        res.render('./agent/dashboard')
    })

    route.get('/register/:id', (req, res) => {
        const encriptedid = req.params.id
        const id = cryptr.decrypt(encriptedid)
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE id = ? ', id, (err, user) => {
                if(user.length > 0){
                    if(user[0].id == id){
                        res.render('./agent/reg', {
                            user: user[0]
                        })
                    }
                }else{
                    // req.flash('danger', 'Invalid Token')
                    res.render('./error')
                }
            })
        })

    })


   



    route.post('/uploads', upload.none(), (req, res) => {
        const params = Object(req.body)
        // console.log(params)
        const email = params.email
        pool.getConnection((err, con) => {
        con.query('SELECT * FROM agent WHERE email = ? ', email, (err, user) => {
            if(user.length > 0){
                console.log(user)
                pool.getConnection((err, con) => {
                    
                    con.query( 'UPDATE agent SET firstname WHERE = ?', [params.firstname],
                     (err, result) => {
                        console.log(result)
                        res.render('./agent/uploads')
                    })
                    
                })
           
            }else{
                res.render('./error')
            }
        })
    })
        // res.render('./agent/uploads')
    })



    return route
}

module.exports = agent()
