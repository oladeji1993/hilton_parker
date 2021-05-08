const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.TOKEN_SECRET);
const bcrypt = require('bcryptjs')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    },
    (username, password, done) => {
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE email = ?', username, (err, result) => {
                const user = result[0]
                if(user){
                    bcrypt.compare(password, user.password, (err, response) => {
                        if (response) {
                            return done(null, user )
                        }else {
                            return done(null, false, { message: 'Incorect Password.' })
                        }
                    })
                    
                }else{
                    return done(null, false, { message: 'Incorrect username.' })   
                }
            })
        })
    }
))

function user() {

    route.get('/', (req, res) => {
        res.redirect('/user/dashboard')
    })
    

    route.get('/login',  (req, res) => {
        if(req.user){
            res.redirect('/user/dashboard')
        }
        else{
        const message = req.flash()
        res.render('./Client/login', {
            message
        })
        }
    }
    )

    route.post('/login',
        passport.authenticate('local', { 
            successRedirect: '/user/dashboard',
            failureRedirect: '/user/login',
            failureFlash: true 
         })
    )

    route.post('/set' , (req, res) => {
        const user = req.body
        pool.getConnection((err, con) => {
            if(err) throw err;
            con.query('SELECT * FROM leads WHERE email = ?', user.email, (err, result) => {
                if (err) throw err;
                if (result.length > 0) {
                    const email = user.email
                    const password = user.password    
                    bcrypt.hash(password, 12).then(hashed => {
                        const sql = "UPDATE leads SET password = ? WHERE email = ?" 
                        con.query(sql, [hashed, email], (err, result) => {
                            req.flash('success', 'Password created Please Login ', )
                            res.redirect('/user/login')
                        })
                    })
                } else{
                    res.redirect('/')
                }

            })
        })
    })

    route.get('/dashboard', (req, res) => {
        if (req.user){
            const user = req.user
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ?', user.id, (err, result) =>{
                    con.query('SELECT * FROM admin WHERE id = ?', result[0].accountofficer, (err, admin) => {
                        con.query('SELECT * FROM admin WHERE id <> ?',  result[0].accountofficer,(err, allAdmins) => {
                            console.log(result[0].accountofficer)
                            console.log(allAdmins)
                            res.render('./Client/dashboard', {
                            user : result,
                            admin: admin[0],
                            allAdmin : allAdmins
    
                        })

                        })
                        
                        
                        
                    
                    })
                })
            })
        }else{
            req.flash('danger', 'Sorry you need to Log-in first', )
            res.redirect('/user/login')
        }
    })


    route.get('/:email', (req, res) => {
        const email = req.params.email
        try{
            const decryptedString = cryptr.decrypt(email);
            console.log(decryptedString)
            pool.getConnection((err, con) => {
                if(err) throw err;
                con.query('SELECT * FROM leads WHERE email = ?', decryptedString, (err, result) => {
                    if (result.length > 0) {
                        res.render('./Client/setPassword', {
                            email : result[0].email
                        })
                    }else{
                        console.log(`error ${result}`)
                        res.render('error')
                    }
                })
            })
        }catch (err){
            res.render('error')
        }
        
        

    })
    return route
}

module.exports = user()