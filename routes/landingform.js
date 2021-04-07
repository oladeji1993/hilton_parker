const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig')
const mailers = require('../services/mailers')
const allocateAdmin = require('../services/allocateAdmin')


function landingForm(){
    route.post('/', (req, res) => {
        const params = req.body
        pool.getConnection((err, con) => {
            if (err) throw err;
    
            con.query('INSERT INTO leads SET ?', params, (err, result) => {
                con.release()
                if(!err){
                    // mailers.newLead(params)
                    const accountManager = allocateAdmin.allocateAdmin
                    console.log(accountManager)
                    res.send(`user ${params.name} added to DB Successfully`)
                }else{
                    console.log(err)
                }
            })
        })
    })

    return route
} 

module.exports = landingForm()