const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const joi = require('joi')
const mailers = require('../config/mailers')
const bcrypt = require('bcryptjs');
require('dotenv').config()
const jwt = require('jsonwebtoken')

const authenticateAdmin =(req, res, next) => {
    console.log('middleware')
    if (req.cookies.authenticate){
        req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
        next()

    }else{
        res.redirect('/login')
    }
}

const schema = joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    email: joi.string().email({ minDomainSegments: 2, tlds: { allow:['com', 'net']}}).required()
})


function admin() {
    route.get('/',authenticateAdmin,  (req,res) => {
        console.log(req.user.id)
        res.send(req.session)
    })

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
                                        res.redirect('/admin/login')
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

    route.post('/login', (req, res) => {
        const userDetails = req.body
        pool.getConnection((err, con) => {
            if (err) res.redirect('/')
            console.log(userDetails.password)
            con.query('SELECT * FROM admin WHERE email = ?', userDetails.username, async (err, user) => {
                console.log(userDetails.password)
                con.release()
                if(user.length > 0){
                    // CHECK PASSWORD 
                    console.log(user[0].password)
                    bcrypt.compare(userDetails.password , user[0].password, (err, response) =>{
                        if(response){
                            const token = jwt.sign({id: user[0].id}, process.env.TOKEN_SECRET)
                            res.cookie('authenticate', token, {maxAge: 3.24e+7}).redirect('/admin')
                        }else{
                            console.log('incorect dets')
                        }
                    })
                    
                }else{
                    res.send('user doesnt exist')
                }
            })
        })
        })
    return route
}

module.exports = admin();