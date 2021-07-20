const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

function suppauth(){

    route.get('/logout', (req, res) => {
        res.cookie('suppauth','');
        res.redirect('/support')
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

    return route
}

module.exports = suppauth()