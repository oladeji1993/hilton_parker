const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const joi = require('joi')
const mailers = require('../config/mailers')
const bcrypt = require('bcrypt');


const schema = joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    email: joi.string().email({ minDomainSegments: 2, tlds: { allow:['com', 'net']}}).required()
})

const saltRounds = 10

function admin() {
    route.get('/register',  (req, res) => {
        res.render('regAdmin')
        }).post('/register', async (req, res) => {
        const params = req.body
        const valid = await schema.validate({
            username:params.username,
            password: params.password,
            email: params.email
        })
        if (valid.error){
            err = valid.error
            console.log(err.details[0].message)
            res.send(err.details[0].message)
        }else{
             bcrypt.genSalt(saltRounds, (err, salt) => {
                 bcrypt.hash(valid.value.password, salt, (err, hash) => {
                    const hashedPassword = hash
                })
            })
            // pool.getConnection((err, con) => {
            //     if (err) throw err;
        
            //     con.query('INSERT INTO admin SET ?', valid.value, (err, result) => {
            //         con.release()
            //         if(!err){
            //             mailers.newLead(params)
            //             res.send(`user ${params.name} added to DB Successfully`)
            //         }else{
            //             console.log(err)
            //         }
            //     })
            // })

            console.log(hashedPassword)
        }
        
        

    })
    return route
}

module.exports = admin();