const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.TOKEN_SECRET);
const bcrypt = require('bcryptjs')
const passport = require('passport');
const mailers = require("../services/mailers");
const multer = require('multer');
var path = require('path')
const LocalStrategy = require('passport-local').Strategy;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb, next) {
        const date = new Date().getTime()
      cb(null, req.user.id + '-' + file.fieldname + '-' + date + '' + path.extname(file.originalname))
    }
    
  })

const upload = multer({ storage: storage })

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

    route.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/')
    })
    route.post('/login',
        passport.authenticate('local', { 
            successRedirect: '/user/dashboard',
            failureRedirect: '/user/login',
            failureFlash: true 
         })
    )
    
    route.get('/uploads', (req, res) => {
        const userid = req.user.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE id = ?', userid, (err, user) => {
                res.render('./Client/uploads', {
                    user: user[0]
                })
            })
        })
        
    })

    route.post('/contact', (req, res) => {
        const details = req.body
        if(details)  {
            mailers.contact(details)
            req.flash('success', 'Message sent ', )
            res.redirect("/contact")
        }else{
            req.flash('danger', 'Message not sent ', )
            res.redirect("/contact")
        }
       
        
    })


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

    var randomProperty = function (obj) {
        var keys = Object.keys(obj);
        return obj[keys[ keys.length * Math.random() << 0]];
    };

    route.get('/dashboard', (req, res) => {
        if (req.user){
            const user = req.user
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ?', user.id, (err, result) =>{
                    con.query('SELECT * FROM admin WHERE id = ?', result[0].accountofficer, (err, admin) => {
                        con.query('SELECT * FROM admin WHERE id <> ?',  result[0].accountofficer,(err, allAdmins) => {
                            const all = randomProperty(allAdmins)
                            res.render('./Client/dashboard', {
                            user : result[0],
                            admin: admin[0],
                            allAdmin : all
    
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

    route.get('/apply', (req, res ) => {
        if(req.user){
            const user = req.user.id
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ?', user, (err, result) => {
                    res.render('./Client/Reg' , {
                        user: result[0]
                    })
                })
                
            })
        }else{
            req.flash('danger', 'Sorry you need to Log-in first', )
            res.redirect('/user/login')
        }
    })
    var cpUpload = upload.fields([
        { name: 'primaryschoolcert', maxCount: 1 }, 
        { name: 'secondaryschoolcert', maxCount: 1}, 
        { name: 'polythecniccert', maxCount: 1}, 
        { name: 'universitycert', maxCount: 1},
        { name: 'othercert', maxCount: 1}
    ])
    route.post('/apply', cpUpload,  (req, res) => {
        if(req.user){
            const {
                primaryschoolcert,
                secondaryschoolcert,
                polythecniccert,
                universitycert,
                othercert
            } = req.files
            const params = Object.values(req.body)
            const user = req.user.id
            pool.getConnection((err, con) => {
                const sql = ` UPDATE leads SET 
                lastname = ?,
                firstname = ?,
                othername = ? ,
                address = ? ,
                dateofbirth = ? ,
                email = ? ,
                phonenumber = ?,
                placeofbirth = ?,
                gender = ?,
                maritalstatus = ?,
                program = ?,
                course1 = ?,
                course2 = ?,
                course3 = ?,
                primaryschoolname = ?,
                primaryschoolyear = ?,
                secondaryschoolname = ?,
                secondaryschoolyear = ?,
                polythecnicname = ?,
                polythecnicyear = ?,
                universityname = ?,
                universityyear = ?,
                primaryschoolcert = ?,
                secondaryschoolcert = ?,
                polythecniccert = ?,
                universitycert = ?,
                othercert = ?
                WHERE id = ${user} 
                `
                console.log(req.body)
                
                params.push(primaryschoolcert[0].filename)
                params.push(secondaryschoolcert[0].filename)
                params.push(polythecniccert[0].filename)
                params.push(universitycert[0].filename)
                params.push(othercert[0].filename)
                console.log(params)
                con.query(sql, params, (err, result) => {
                    console.log(result)
                    res.redirect('/user/dashboard')
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