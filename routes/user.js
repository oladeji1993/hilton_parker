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
      cb(null, './assets/uploads/academics')
    },
    filename: function (req, file, cb, next) {
      cb(null, req.user.id + '-' + file.fieldname + path.extname(file.originalname))
    }
    
  })

  const upload = multer({ storage: storage })

 
  const Pstorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './assets/uploads/passports')
    },
    filename: function (req, file, cb, next) {
      cb(null, req.user.id + '-' + file.fieldname + path.extname(file.originalname))
    }
    
  })

  const Pupload = multer({ storage: Pstorage })
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
        res.render('/login', {
            message
        })
        }
    }
    )

    route.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/user/login')
    })
    route.post('/login',
        passport.authenticate('local', { 
            successRedirect: '/user/dashboard',
            failureRedirect: '/user/login',
            failureFlash: true 
         })
    )
    
    route.get('/uploads', (req, res) => {
        if(req.user){
            const userid = req.user.id
            pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE id = ?', userid, (err, user) => {
                if(user[0].status == 'paid'){
                    req.flash('success', 'Your Application is Complete')
                    res.redirect('/user/dashboard')
                }else{
                    res.render('/uploads', {
                        user: user[0]
                    })
                }
               
            })
        })
        }else{
            req.flash('danger', 'You must login first')
            res.redirect('/user/login')
        }
        
        
    })

    const bscupload = upload.fields([
        {name : 'waec', maxCount: 1},
        {name : 'passport', maxCount: 1},
        {name : 'other', maxCount: 1}
    ])
    route.post('/submit/bsc/', (req, res, next) => {
        if(req.user){
            next()
        }else{
            req.flash('warning', 'Session expired please log-in')
            res.redirect('/user/login')
        }
    },bscupload,  (req, res) => {
        if(req.user){
            const userid = req.user.id
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ? ', userid, (err, users) => {
                    if(users.length > 0){
                        const user = users[0]
                        const data = Object.values(req.body)
                        data.push('pending')
                        data.push(user.id)
                        con.query('UPDATE leads SET course1 = ? , course2 = ?, course3 = ?, status = ? WHERE id = ?', data , (err, result ) => {
                            console.log(err)
                            console.log(result)
                            req.flash('success', 'Document Uploaded successful')
                            res.redirect('/user/dashboard')
                        })
                    }else{
                        res.render('error')
                    }

                })
            })
        }else{
            res.redirect('/user/login')
        }
    } )

    const pgdupload = upload.fields([
        {name : 'waec', maxCount: 1},
        {name : 'passport', maxCount: 1},
        {name : 'other', maxCount: 1}
    ])
    route.post('/submit/pgd/', pgdupload,  (req, res) => {
        if(req.user){
            const userid = req.user.id
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ? ', userid, (err, users) => {
                    if(users.length < 0){
                        const user = users[0]
                        const data = Object.values(req.body)
                        data.push('pending')
                        data.push(user.id)
                        con.query('UPDATE leads SET course1 = ? , course2 = ?, course3 = ? WHERE id = ?', data , (err, result ) => {
                            req.flash('success', 'Document Uploaded successful')
                            res.redirect('/user/dashboard')
                        })
                    }

                })
            })
        }else{
            res.redirect('/user/login')
        }
    } )


    const mscupload = upload.fields([
        {name : 'waec', maxCount: 1},
        {name : 'passport', maxCount: 1},
        {name : 'other', maxCount: 1}
    ])
    route.post('/submit/msc/', mscupload,  (req, res) => {
        if(req.user){
            const userid = req.user.id
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ? ', userid, (err, users) => {
                    if(users.length < 0){
                        const user = users[0]
                        const data = Object.values(req.body)
                        data.push('pending')
                        data.push(user.id)
                        con.query('UPDATE leads SET course1 = ? , course2 = ?, course3 = ? WHERE id = ?', data , (err, result ) => {
                            req.flash('success', 'Document Uploaded successful')
                            res.redirect('/user/dashboard')
                        })
                    }

                })
            })
        }else{
            res.redirect('/user/login')
        }
    } )



  

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
                            const message = req.flash()
                            const all = randomProperty(allAdmins)
                            res.render('/dashboard', {
                            user : result[0],
                            admin: admin[0],
                            allAdmin : all,
                            message : message 
    
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
            const userid = req.user.id
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM leads WHERE id = ?', userid, (err, result) => {
                    const user = result[0]
                    if(user.status == 'paid'){
                        req.flash('success', 'Your Application is Complete')
                        res.redirect('/user/dashboard')
                    }else if( user.status == 'new') { 
                        res.render('/Reg'  , {
                            user
                        })
                    }else if ( user.status == 'registered'){
                        res.render('/uploads'  , {
                            user
                        })
                    }else{
                        res.render('/payment' , {
                            agent: false,
                            user
                    })
                }
                })
                
            })
        }else{
            req.flash('danger', 'Sorry you need to Log-in first', )
            res.redirect('/user/login')
        }
    })
    

    route.post('/apply',  Pupload.single('passport') , (req, res) => {
        if(req.user){
            console.log(req.file)
            console.log(req.file.filename)
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
                passport = ?, 
                status = "registered"
                WHERE id = ${user} 
                `
                params.push(req.file.filename)
                con.query(sql, params, (err, result) => {
                    req.flash('success', 'Information updated', )
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
                        res.render('/setPassword', {
                            email : result[0].email
                        })
                    }else{
                        res.render('error')
                    }
                })
            })
        }catch (err){
            res.render('error')
        }


    // another change 
    })

    route.post('/contactus', (req, res) =>{
        const msg = req.body
        if(msg)  {
            mailers.contactus(msg)
            req.flash('success', 'Message sent ', )
            res.redirect("/")
        }else{
            req.flash('danger', 'Message not sent ', )
            res.redirect("/")
        }
    })

    return route
}

module.exports = user()