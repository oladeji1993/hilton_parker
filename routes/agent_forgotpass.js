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






function reset_password() {


    route.get('/',  (req, res) => {
       const message = req.flash()
        res.render('./agent/forgot_password', {
            message: message
        }) 
    }
    )

    route.post('/', (req, res) => {
        const message = req.flash()
        const email = req.body.email
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE email = ? ', email, (err, user) => {
                if (user.length > 0){
                    const encryptedid = cryptr.encrypt(user[0].id);
                    const token = cryptr.encrypt(user[0].id + user[0].email)
                    const mail = user[0].email
                    mailers.agent_reset_password(encryptedid,mail, token)
                    const sql = "UPDATE agent SET token = ? WHERE id = ?" 
                    con.query(sql, [token ,user[0].id], (err, response) => {
                        req.flash('info', 'Password reset link sent check your mailbox')
                        res.redirect('/agent_forgotpass')
                    })

                }else{
                    req.flash('warning', 'User does not exist')
                    res.redirect('/agent/login')
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
                con.query('SELECT * FROM agent WHERE id = ? ', id, (err, user) => {
                    if(user.length > 0){
                        if(user[0].id == id){}
                        try {
                            const decrptedtoken = cryptr.decrypt(token)
                            if(user[0].token != 'null'){
                                try {
                                    const dbtoken = cryptr.decrypt(user[0].token)
                                    if(decrptedtoken === dbtoken){
                                        res.render('./agent/createnewpass' , {
                                                message: message,
                                                email: user[0].email
                                            })
                                    }else{
                                        req.flash('danger', 'Invalid Token')
                                        res.redirect('/agent_forgotpass')
                                        }
                                } catch (err) {
                                    req.flash('danger', 'Invalid Token')
                                    res.redirect('/agent_forgotpass')
                                }

                            }else{
                                req.flash('danger', 'Invalid Token')
                                res.redirect('/agent_forgotpass')    
                            }
                        } catch (err) {
                            req.flash('danger', 'Invalid Token')
                            res.redirect('/agent_forgotpass')
                        }
                    }else{
                        req.flash('danger', 'Invalid Token')
                        res.redirect('/agent_forgotpass')
                    }
                })
            })
        }catch(err){
                req.flash('danger', 'Invalid Token')
                res.redirect('/agent_forgotpass')
            
        }

    })

    route.post('/reset', (req, res) => {
        const newpassword = req.body.password
        const email = req.body.email
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE email = ?',email, (err, response) => {
                // console.log(response)
                if(response){
                    bcrypt.hash(newpassword, 12).then(hashed => {
                        const sql = "UPDATE agent SET password = ? WHERE email = ?" 
                        con.query(sql, [hashed, email], (err, result) => {
                            const sql2 = "UPDATE agent SET token = ? WHERE email = ?" 
                            con.query(sql2, ['null', email], (err, result) => {
                                console.log(result)
                                req.flash('info', 'Password updated Please Login ', )
                                res.redirect('/agent/login')
                            })
                            
                        })
                    })
                }else{
                    req.flash('danger', 'An error occurred please try again')
                    res.redirect('/agent_forgotpass')
                }
            })
        })

    })
    return route
}

module.exports = reset_password(); 
