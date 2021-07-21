const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

function suppauth(){

    route.get('/logout', (req, res) => {
        res.cookie('suppauth','');
        res.redirect('/staff')
    })

    route.post('/', (req, res) => {
        const data = Object.values(req.body)
        // console.log(data)
        pool.getConnection((err, con) => {
            if(err){
                res.render('error')
            }else{
                con.query('SELECT * FROM support WHERE username = ?', data[0], (err, result) => {
                    con.release()
                    if(err){
                        res.send(err)
                    }else if(result.length == 0){
                        req.flash('warning', 'Incorect Login Details')
                        res.redirect('/support')
                    }else{
                        // console.log(result)
                        bcrypt.compare(data[1], result[0].password , function(err, resul) {
                            // res === true
                            if(resul === true){
                                const token = jwt.sign({id: result[0].id}, process.env.TOKEN_SECRET)
                                res.cookie('suppauth', token, {maxAge: 11510000}).redirect('/support')
                                
                            }else{
                                req.flash('warning', 'Incorect Login Details')
                                res.redirect('/support')
                            }
                        });
                    }
                })
            }
        })

    })

    route.post('/agofficer', (req, res) => {
        const data = Object.values(req.body)
        pool.getConnection((err, con) => {
            if(err){
                res.render('error')
            }else{
                con.query('SELECT * FROM agentofficer WHERE email = ?', data[0], (err, result) => {
                    con.release()
                    if(err){
                        res.send(err)
                    }else if(result.length == 0){
                        req.flash('warning', 'Incorect Login Details')
                        res.render('./agentofficer/login', {
                            message: req.flash()
                        })
                    }else{
                        // console.log(result)
                        bcrypt.compare(data[1], result[0].password , function(err, resul) {
                            // res === true
                            if(resul === true){
                                const token = jwt.sign({id: result[0].id}, process.env.TOKEN_SECRET)
                                res.cookie('agofficer', token, {maxAge: 11510000}).redirect('/agofficer')
                                
                            }else{
                                req.flash('warning', 'Incorect Login Details')
                                res.render('./agentofficer/login', {
                                    message: req.flash()
                                })
                            }
                        });
                    }
                })
            }
        })

    })

    route.post('/bdo', (req, res) => {
        const data = Object.values(req.body)
        pool.getConnection((err, con) => {
            if(err){
                res.render('error')
            }else{
                con.query('SELECT * FROM bdo WHERE email = ?', data[0], (err, result) => {
                    con.release()
                    if(err){
                        res.send(err)
                    }else if(result.length == 0){
                        req.flash('warning', 'Incorect Login Details')
                        res.render('./bdo/login', {
                            message: req.flash()
                        })
                    }else{
                        // console.log(result)
                        bcrypt.compare(data[1], result[0].password , function(err, resul) {
                            // res === true
                            if(resul === true){
                                const token = jwt.sign({id: result[0].id}, process.env.TOKEN_SECRET)
                                res.cookie('bdo', token, {maxAge: 11510000}).redirect('/bdo')
                                
                            }else{
                                req.flash('warning', 'Incorect Login Details')
                                res.render('./bdo/login', {
                                    message: req.flash()
                                })
                            }
                        });
                    }
                })
            }
        })

    })
    return route
}

module.exports = suppauth()