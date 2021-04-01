const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const joi = require('joi')
const mailers = require('../config/mailers')
const bcrypt = require('bcryptjs');


const schema = joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    email: joi.string().email({ minDomainSegments: 2, tlds: { allow:['com', 'net']}}).required()
})


function admin() {
    // GET /ADMIN/REGISTER ROUTE 
    route.get('/register', (req,res) => {
        res.render('regAdmin')
    })

    // POST TO /ADMIN/REGISTER ROUTE 
    route.post('/register', async(req, res) => {
        const params = req.body

        // VALIDATE FORM ENTRY 
        const valid = await schema.validate({
            username:params.username,
            password: params.password,
            email: params.email
        })

        // CHECK FOR ERROR 
        if (valid.error){
            err = valid.error 
            res.send(err.details[0].message)
        }else{
            // HASH PASSWORD 
            bcrypt.hash(valid.value.password, 12)
            .then(hashedpassword => {
                const {value} = valid
                value.password = hashedpassword
                
                // CONNECT TO DB 
                pool.getConnection((err, con) => {
                    if(err) throw err;

                    // CHECK IF EMAIL EXIST 
                    con.query('SELECT * FROM admin WHERE email = ?', value.email, (err, result) => {
                        if(!err){
                            const st = result.length
                            if(st == 0){
                                con.query('INSERT INTO admin SET ?', value, (err, result) => {
                                    con.release()
                                    if(!err){
                                        res.redirect('/login')
                                    }else{
                                        res.send(err)
                                    }
                                })
                            }else{
                                res.send('user already exist')
                            }
                        }else{
                            res.send(err)
                        }
                    })
                })
            })
        }
    })

    route.get('/login', (req, res) => {
        res.render('login')
    })
    return route
}

module.exports = admin();