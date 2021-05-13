const { Router } = require("express");
const express = require("express");
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.TOKEN_SECRET);
const pool = require('../config/dbconfig')
const route = express.Router();
var flash = require('express-flash');
const mailers = require("../services/mailers");
const bcrypt = require('bcryptjs');
require("dotenv")






function forgot_password() {


    route.get('/',  (req, res) => {
       const message = req.flash()
        res.render('./Client/recovery', {
            message: message
        }) 
    }
    )

    route.post('/', (req, res) => {
        const message = req.flash()
        const email = req.body.email
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE email = ? ', email, (err, user) => {
                if (user.length > 0){
                    const encryptedid = cryptr.encrypt(user[0].id);
                    const token = cryptr.encrypt(user[0].id + user[0].email)
                    const mail = user[0].email
                    mailers.forgot_password(encryptedid,mail, token)
                    console.log(user[0].id)
                    const sql = "UPDATE leads SET token = ? WHERE id = ?" 
                    con.query(sql, [token ,user[0].id], (err, user) => {
                        console.log(user)
                        res.render('./Client/reset-password' , {
                            message
                        })
                    })

                }else{
                    req.flash('warning', 'User does not exist')
                    res.redirect('/user/login')
                }
            } )
        })
    })
    route.get('/:id/:token' , (req, res) => {
        const message = req.flash()
        const encriptedid = req.params.id
        try{
            const id = cryptr.decrypt(encriptedid)
            const token = req.params.token
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ? ', id, (err, user) => {
                    if(user.length > 0){
                        if(user[0].id == id){}
                        try {
                            const decrptedtoken = cryptr.decrypt(token)
                            if(user[0].token != null){
                                try {
                                    const dbtoken = cryptr.decrypt(user[0].token)
                                    if(decrptedtoken === dbtoken){
                                        res.render('./Client/reset-password' , {
                                                message
                                            })
                                    }else{
                                        req.flash('danger', 'Invalid Token')
                                        res.redirect('/forgot-password')
                                        }
                                } catch (err) {
                                    req.flash('danger', 'Invalid Token')
                                    res.redirect('/forgot-password')
                                }

                            }
                        } catch (err) {
                            req.flash('danger', 'Invalid Token')
                            res.redirect('/forgot-password')
                        }
                    }else{
                        req.flash('danger', 'Invalid Token')
                        res.redirect('/forgot-password')
                    }
                })
            })
        }catch(err){
            if(err){
                req.flash('danger', 'Invalid Token')
                res.redirect('/forgot-password')
            }
        }
    //     
        
        

    })

    route.post('/')
    return route
}

module.exports = forgot_password();
