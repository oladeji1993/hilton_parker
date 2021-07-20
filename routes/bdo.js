const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig')
const mailers = require('../services/mailers')



function bdo(){

    route.use((req, res, next) => {
       
        if (req.cookies.bdo ){
            const techie  = jwt.verify(req.cookies.bdo, process.env.TOKEN_SECRET)
            pool.getConnection((err, con) => {
                if(err){
                    res.render('error')
                }else{
                    con.query('SELECT * FROM support WHERE id = ?', techie.id, (err, result) => {
                        con.release()
                        if(result.length > 0.5){
                            next()
                        }else{
                            req.flash('danger', 'You Must Login First', )
                            res.render('./bdo/login', {
                                message: req.flash()
                            })
                        }
                    })
                }
            })
            }else{
            req.flash('danger', 'You Must Login First', )
            res.render('./bdo/login', {
                message: req.flash()
            })
            } 
    })
   route.get('/', (req, res) => {
       res.send('bdo')
   })

   route.post('/login', (req, res) => {
       const credentials = req.body
       res.send(credentials)

   })
    return route
} 

module.exports = bdo()