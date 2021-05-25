const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig')
const mailers = require('../services/mailers')
const bcrypt = require('bcryptjs');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.TOKEN_SECRET);



function landingForm(){
    route.post('/', (req, res, next) => {
        pool.getConnection((err, con) => {
            if(err) throw err;
            con.query('SELECT * FROM admin', (err, results) => {
                results.sort((a, b) => {
                    return a.client - b.client;
                })
                con.query('SELECT * FROM admin WHERE email = ?', results[0].email, (err, resu) => {
                    const update =resu[0].client + 1
                    const accountOfficer= resu[0].id
                    res.accountOfficer = accountOfficer
                    con.query(`UPDATE admin SET client =? WHERE id = ${accountOfficer}`,update , (err, ress) => {
                        con.release()
                        next()
                    } )
                } )
            } )
            })
    }, (req, res) => {
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE email = ? ', req.body.email, (err, user) => {
                console.log(user)
                if(user.length > 0){
                    req.flash('warning', 'Email has already been used please login or contact a Customer Support')
                    res.redirect('/')
                }else{
                    con.query(`SELECT * FROM admin WHERE id = ${res.accountOfficer}`, (err, admin) => {
                        const params = req.body
                        params.accountofficer = admin[0].id
                        params.regdate = (new Date()).toLocaleDateString('en-US')
                        params.status = 'new'
                        con.query('INSERT INTO leads SET ?', params, async (err, result) => {
                            con.release()
                            if(!err){
                                // GENERATE DYNAMIC LINK TO CREATE PASSWORD
                                const hashed = cryptr.encrypt(params.email);
                                params.hash = hashed
                                mailers.agent(params)
                                mailers.agentofficer(params)
                                res.render('./client/success')
                            }else{
                                res.render('./error')
                            }
                        })
                    }
                    )
                }
                
            })
            
            
        })
    })


    route.post('/agent', (req, res, next) => {
        pool.getConnection((err, con) => {
            if(err) throw err;
            con.query('SELECT * FROM admin', (err, results) => {
                results.sort((a, b) => {
                    return a.client - b.client;
                })
                con.query('SELECT * FROM admin WHERE email = ?', results[0].email, (err, resu) => {
                    const update =resu[0].client + 1
                    const accountOfficer= resu[0].id
                    res.accountOfficer = accountOfficer
                    con.query(`UPDATE admin SET client =? WHERE id = ${accountOfficer}`,update , (err, ress) => {
                        con.release()
                        next()
                    } )
                } )
            } )
            })
    }, (req, res) => {
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE email = ? ', req.body.email, (err, agent) => {
                console.log(agent)
                
                if(agent.length > 0){
                    req.flash('warning', 'Email has already been used please login or contact a Customer Support')
                    res.redirect('/agent')
                    console.log("i not am hrrr")
                }else{
                    con.query(`SELECT * FROM admin WHERE id = ${res.accountOfficer}`, (err, admin) => {
                       
                        const params = req.body
                        params.accountofficer = admin[0].id
                        params.regdate = (new Date()).toLocaleDateString('en-US')
                        params.status = 'new'
                        con.query('INSERT INTO agent SET ?', params, async (err, result) => {
                            
                            con.release()
                            
                            if(!err){
                                // GENERATE DYNAMIC LINK TO REGISTER
                                con.query('SELECT * FROM agent WHERE email = ? ', params.email, (err, user) => {
                                    if(user.length > 0){
                                        const encryptedid = cryptr.encrypt(user[0].id);
                                        const mail = user[0].email
                                        mailers.agent(params,encryptedid)
                                        res.render('./client/success')
                                    }else{
                                        res.render('./error')
                                    }
                                })
                            }
                        })
                    }
                    )
                }
                
            })
            
            
        })
    })


    return route
} 

module.exports = landingForm()