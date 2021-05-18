const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const joi = require('joi')
const bcrypt = require('bcryptjs');
require('dotenv').config()
const jwt = require('jsonwebtoken')
flash = require('express-flash')



const schema = joi.object({
    firstname: joi.string().alphanum().min(3).max(30).required(),
    lastname: joi.string().alphanum().min(3).max(30).required(),
    phonenumber: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().required(),
    email: joi.string().email({ minDomainSegments: 2, tlds: { allow:['com']}}).required()
})


function admin() {

    route.get('/logout', (req, res) => {
        res.cookie('authenticate','', {expiresIn: Date.now()})
        res.redirect('/admin/login')
    })

    route.get('/',  authenticateAdmin =(req, res, next) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            console.log(req.user)
            next()
         }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('admin/login')
            }
    },(req,res) => {
        res.redirect('admin/dashboard') 
    })

    // GET ADMIN DASHBOARD 
    route.get('/dashboard', (req, res, next) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/admin/login')
            } 
    }, (req, res) => {
        const id = req.user.id
        pool.getConnection((err, con) => {
            if (err) throw err;
            con.query('SELECT * FROM admin WHERE id = ?', id, (err, admin) => {
                    res.render('./admin/dashboard')
            } )
        })
    })

    // GET /ADMIN/REGISTER ROUTE 
    route.get('/register', (req, res, next) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            res.redirect('/admin/dashboard')
         }else{
             next()
            }
    } , (req,res) => {
        res.render('./admin/sign-up')
    })

    // POST TO /ADMIN/REGISTER ROUTE 
    route.post('/register', async(req, res) => {
        const params = req.body
        // VALIDATE FORM ENTRY 
        const valid = await schema.validate({
            firstname:params.firstName,
            lastname:params.lastName,
            phonenumber:params.phonenumber,
            password: params.password,
            email: params.email
        })
        // CHECK FOR ERROR 
        if (valid.error){
            err = valid.error 
            // res.send(err.details[0].message)
            res.render('error')
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
                        const email = value.email
                        con.query('SELECT * FROM admin WHERE email = ?', [email], (err, result) => {
                        if(!err){
                            const st = result.length
                            if(st == 0){
                                con.query('INSERT INTO admin SET ?', value, (err, result) => {
                                    con.release()
                                    if(!err){
                                        req.flash('success', 'Account Created please login', )
                                        res.redirect('/admin/login')
                                    }else{
                                        res.render('error')
                                    }
                                })
                            }else{
                                req.flash('danger', 'Email already exists Login Insteads', )
                                res.redirect('/admin/login')
                            }
                        }else{
                            // res.send(err)
                            res.render('error')
                        }
                    })
                })
            })
        }
    })

    // GET ADMIN LOGIN
    route.get('/login', authenticateAdmin =(req, res, next) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            res.redirect('/admin/dashboard')
    
        }else{
            next()
        }
    }, (req, res) => {
        const message = req.flash()
        res.render('./admin/login', {
            message
        })
    })

        // POST TO ADMIN LOGIN 
    route.post('/login', (req, res) => {
        const userDetails = req.body
        pool.getConnection((err, con) => {
            if (err) res.redirect('/')
            con.query('SELECT * FROM admin WHERE email = ?', userDetails.email, async (err, user) => {
                con.release()
                if(user.length > 0){
                    // CHECK PASSWORD 
                    bcrypt.compare(userDetails.password , user[0].password, (err, response) =>{
                        if(response){
                            const token = jwt.sign({id: user[0].id}, process.env.TOKEN_SECRET)
                            res.cookie('authenticate', token, {maxAge: 43200000}).redirect('/admin')
                        }else{
                            req.flash('danger', 'incorrect password')
                            res.redirect('/admin/login')
                        }
                    })
                    
                }else{
                    req.flash('danger', 'Incorect Email or Password')
                    res.redirect('/admin/login')
                }
            })
        })
        })



    // DASHBOARD NAVIGATION LINKS
    route.get('/newApplicants', (req, res) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            // console.log(req.user)
        }
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM leads WHERE status = "new" && accountofficer = ?', accountofficer, (err, userList) =>{
                if(userList.length > 0){
                    // console.log(userList)
                    res.render('./admin/newapplicants', {
                        userList
                    })
                }else{
                    res.render('./admin/newapplicants', {
                        userList
                    })
                }
            })
        })
    })

    route.get('/completereg', (req, res) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            // console.log(req.user)
        }
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM leads WHERE status = "complete registration" && accountofficer = ?', accountofficer, (err, userList) =>{
                if(userList.length > 0){
                    // console.log(userList)
                    res.render('./admin/completereg', {
                        userList
                    })
                }else{
                    res.render('./admin/completereg', {
                        userList
                    })
                }
            })
        })
    })

    route.get('/makepayment', (req, res) => {
        res.render('./admin/makepayment')
    })

    route.get('/success', (req, res) => {
        res.render('./admin/successfulapp')
    })



    route.get('/home', (req, res) => {
        res.render('./admin/dashboard')
    })
       
        
    return route
}

module.exports = admin();