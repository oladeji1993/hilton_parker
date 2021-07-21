const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig')
const mailers = require('../services/mailers')
const jwt = require('jsonwebtoken')



function agofficer(){


    // AUTH MIDDLEWARE
    route.use((req, res, next) => {
       
        if (req.cookies.agofficer ){
            const agofficerid  = jwt.verify(req.cookies.agofficer, process.env.TOKEN_SECRET)
            pool.getConnection((err, con) => {
                if(err){
                    res.render('error')
                }else{
                    con.query('SELECT * FROM agentofficer WHERE id = ?', agofficerid.id, (err, result) => {
                        con.release()
                        if(result.length > 0.5){
                            next()
                        }else{
                            req.flash('danger', 'You Must Login First', )
                            res.render('./agentofficer/login', {
                                message: req.flash()
                            })
                        }
                    })
                }
            })
            }else{
            req.flash('danger', 'You Must Login First', )
            res.render('./agentofficer/login', {
                message: req.flash()
            })
            } 
    })
    // AUTH MIDDLEWARE END 

   route.get('/', (req, res) => {
       res.send('agofficer')
   })

   route.post('/login', (req, res) => {
       const credentials = req.body
       res.send(credentials)

   })

   route.get('/logout', (req, res) => {
    res.cookie('agofficer','');
    res.redirect('/staff')
})
   
    return route
} 

module.exports = agofficer()