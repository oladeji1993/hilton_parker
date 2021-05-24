const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const joi = require('joi')
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.TOKEN_SECRET);
const bcrypt = require('bcryptjs');
require('dotenv').config()
const multer = require('multer');
const jwt = require('jsonwebtoken');
const user = require('./user');
flash = require('express-flash')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './assets/uploads')
    },
    filename: function (req, file, cb, next) {
        const date = new Date().getTime()
      cb(null, req.user.id + '-' + file.fieldname + '-' + date + '' + path.extname(file.originalname))
    }
    
  })


const upload = multer({ storage: storage })


function agent() {

    route.get('/', (req, res) => {
        res.redirect('/agent/dashboard')
    })
    

    route.get('/login',  (req, res) => {
        if(req.user){
            res.redirect('/agent/dashboard')
        }
        else{
        const message = req.flash()
        res.render('./agent/login', {
            message
        })
        }
    })

    route.get('/dashboard', (req, res) => {
        res.render('./agent/dashboard')
    })

    route.get('/register/:id', (req, res) => {
        const encriptedid = req.params.id
        const id = cryptr.decrypt(encriptedid)
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE id = ? ', id, (err, user) => {
                if(user.length > 0){
                    if(user[0].id == id){
                        res.render('./agent/reg', {
                            user: user[0]
                        })
                    }
                }else{
                    res.render('./error')
                }
            })
        })

    })

    route.post('/register', upload.none(), (req, res) => {
        const params = Object(req.body);
        const data = Object.values(req.body);
        const email = params.email
        pool.getConnection((err, con) => {
        con.query('SELECT * FROM agent WHERE email = ? ', email, (err, respons) => {
            if(!respons){
                res.render('./error')    
           
            }else{
                pool.getConnection((err, con) => {

                    let sql = `UPDATE agent SET 
                    firstname = ?,
                    lastname = ?,
                    email= ?,
                    phonenumber= ?,
                    nationality = ?,
                    residentialaddress = ?,
                    phonenumber2 = ?,
                    officeaddress = ?,
                    g1_fullname = ?,
                    g1_address = ?,
                    g1_phone = ?,
                    g1_email = ?,
                    g1_relationship = ?,
                    g2_fullname = ?,
                    g2_address = ?,
                    g2_phone = ?,
                    g2_email = ?,
                    g2_relationship = ?
                    
                    WHERE id = ${respons[0].id}`;

                    con.query(sql, data, (err, result) => {
                        if(result){
                            res.render('./agent/createpassword', {
                                respons: respons[0]
                            })
                        }
                        
                    })
                    
                })
            }
        })
    })

    })


    // var cpUpload = upload.fields([{ name: 'document', maxCount: 3 }])
    // route.post('/uploads', (req, res, next)  => {
    //     if(req.user){
    //         next()
    //     }else{
    //         req.flash('danger', 'You must login first')
    //         res.redirect('/user/login')
    //     }
    // },cpUpload ,(req, res) => {
    //     pool.getConnection((err, con) => {
    //         con.query('SELECT * FROM agent WHERE id = ? ', req.user.id, (err, result) => {
    //             const files = req.files
    //             const fields = req.body
    //             const lead = result[0]
    //             const accountofficerid = result[0].accountofficer
    //             con.query('SELECT * FROM admin WHERE id = ? ', accountofficerid, (err, resu) => {
    //                 const accountofficer = resu[0] 
    //                 mailers.document_upload(lead, accountofficer)
    //                 // res.redirect('/user/dashboard')
    //                 console.log("working")
    //             })
                
    //         })
    //     })
        

    // })


    route.post('/setpassword' , (req, res) => {
        const data = req.body.email
        const message = req.flash()
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE email = ? ', data, (err, output) => {
                if (err) throw err;
                if(output.length > 0){
                    const password = req.body.password
                    bcrypt.hash(password, 12).then(secured =>{
                        const sql = 'UPDATE agent SET password = ?'
                        con.query(sql, [secured], (err, resu) => {
                            req.flash('success', 'Password created Please Login' )
                            res.render('./agent/login', {       
                                message: message
                            })
                        })
                    })
                }else{
                    res.render('./error')   
                }
            })
        })
    })


    
        // POST TO AGENT LOGIN 
        route.post('/login', (req, res) => {
            const userDetails = req.body
            pool.getConnection((err, con) => {
                if (err) res.redirect('/')
                con.query('SELECT * FROM agent WHERE email = ?', userDetails.email, async (err, user) => {
                    con.release()
                    if(user.length > 0){
                        // CHECK PASSWORD 
                        bcrypt.compare(userDetails.password , user[0].password, (err, response) =>{
                            if(response){
                                const token = jwt.sign({id: user[0].id}, process.env.TOKEN_SECRET)
                                res.cookie('authenticate', token, {maxAge: 43200000}).redirect('/agent/dashboard')
                            }else{
                                req.flash('danger', 'incorrect password')
                                res.redirect('/agent/login')
                            }
                        })
                        
                    }else{
                        req.flash('danger', 'Incorrect Email or Password')
                        res.redirect('/agent/login')
                    }
                })
            })
        })

        route.get('/logout', (req, res) => {
            req.logout();
            res.redirect('/agent/login')
        })

    return route
}

module.exports = agent()
