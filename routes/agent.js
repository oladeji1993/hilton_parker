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
const mailers = require('../services/mailers');
flash = require('express-flash')
var path = require('path');
const { result } = require('lodash');
const { setMaxListeners } = require('../config/dbconfig');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './assets/uploads/agent')
    },
    filename: function (req, file, cb, next) {
        const date = new Date().getTime()
      cb(null, req.cookies.agent_id + '-' + file.fieldname + '-' + '' + path.extname(file.originalname))
    }
    
  })


const upload = multer({ storage: storage })


function agent() {

    route.get('/', (req, res) => {
        res.render('./agent/agent')
    })
    

    route.get('/login', auth =(req, res, next) => {
        if (req.cookies.agent){
            req.user = jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            next()
         }else{
            res.render('./agent/login', {
                message : req.flash()
            })
            }}, (req, res) => {
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

    route.get('/dashboard', auth =(req, res) => {
        console.log(req.cookies)
        if (req.cookies.agent){
            req.user = jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM agent WHERE id = ?', req.user.id, (err, rest) => {
                    if(rest.length )
                    con.query(`SELECT * FROM admin WHERE id = ${rest[0].accountofficer}`, (err, acct) => {
                        res.render('./agent/dashboard', {
                            agent : rest[0],
                            accountofficer : acct[0]
                        })
                    })
                    
                
                }    )
            })
         }else{
            req.flash('danger', 'You Must Login First', )
            res.render('./agent/login', {
                message : req.flash()
            })
            }})

    route.get('/register/:id', (req, res) => {
        const encriptedid = req.params.id
        const id = cryptr.decrypt(encriptedid)
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE id = ? ', id, (err, user) => {
                if(user.length > 0){
                    if(user[0].id == id){
                        if(user[0].status == 'applied'){
                            res.render('./agent/uploads', {
                                respons : user[0]
                            })
                        }else if(user[0].status == 'verified'){
                            res.send('verified')
                        }else if(user[0].status == 'submit'){
                            res.render('./Client/success')
                        }
                        else{
                            res.render('./agent/reg', {
                                user: user[0]
                            })
                        }
                        
                    }
                }else{
                    res.render('./error')
                }
            })
        })

    })

    route.post('/register',upload.none(), (req, res) => {
        const params = Object(req.body);
        const data = Object.values(req.body);
        const email = params.email
        pool.getConnection((err, con) => {
        con.query('SELECT * FROM agent WHERE email = ? ', email, (err, respons) => {
            if(!respons){
                res.render('./error')    
           
            }else{
                const ref = 'HPS-AG-00' + respons[0].id
                data.push(ref)
                pool.getConnection((err, con) => {

                    let sql = `UPDATE agent SET 
                    firstname = ?,
                    lastname = ?,
                    email= ?,
                    phonenumber= ?,
                    nationality = ?,
                    residentialaddress = ?,
                    phonenumber2 = ?,
                    status = 'applied',
                    officeaddress = ?,
                    agent_id = ?
                    WHERE id = ${respons[0].id}`;
                    con.query(sql, data, (err, result) => {
                        if(result){
                            con.query('SELECT * FROM agent WHERE id = ? ', respons[0].id, (err, resp) => {
                                res.cookie('agent_id', ref, {maxAge: 43200000}).redirect('/agent/uploads')
                            })
                           
                        }else{
                            res.render('error')
                        }
                        
                    })
                    
                })
            }
        })
    })

    })

    route.get('/uploads', (req, res) =>{
        const agent = req.cookies.agent_id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE agent_id = ? ', agent , (err, result) => {
                res.render('./agent/uploads', {
                    respons: result[0]
                })
            })
        })
    })

    var cpUpload = upload.fields([{ 
        name: 'g1_id', maxCount: 1 },
        {
            name:'g1_passport', maxCount: 1
        },
        {
            name:'g2_id', maxCount: 1
        },
        {
            name:'g2_passport', maxCount: 1
        }
    ])
    route.post('/uploads/:id', cpUpload, (req, res) => {
        pool.getConnection((err, con) => {
            const agent = req.cookies.agent_id
            con.query('SELECT * FROM agent WHERE agent_id = ? ', agent, (err, result) => {
                // res.cookie('agent_id','', {expiresIn: Date.now()}).redirect('/')
                // const files = req.files
                const fields = Object.values(req.body);
                const lead = result[0]
                const accountofficerid = result[0].accountofficer
                fields.push(agent)
                const sql = `UPDATE agent SET g1_fullname = ?,
                g1_address =?,
                g1_phone =?,
                g1_email =?,
                g1_relationship =?,
                g2_fullname =?,
                g2_address =?,
                g2_phone =?,
                g2_email =?,
                g2_relationship =?,
                status = 'submit'
                WHERE agent_id = '${agent}'`
                con.query(sql, fields,(err, resp) => {
                    mailers.notify(lead)
                    res.render('./Client/success')
                })
                
            })
        })
        

    })


    route.get('/password/:id', (req, res) => {
        const id = req.params.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE id = ?', id, (err, result) => {
                if(err){
        
                }
                if(result.length > 0){
                    const agent = result[0]
                    res.render('./agent/createnewpass', {
                        message : req.flash(),
                        email: agent.email
                    })
                }else{
                    res.render('error')
                }
            })
        })
    })
    route.post('/setpassword/' , (req, res) => {
        const data = req.body.email
        const message = req.flash()
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE email = ? ', data, (err, output) => {
                if (err) throw err;
                if(output.length > 0){
                    const password = req.body.password
                    const email = req.body.email
                    bcrypt.hash(password, 12).then(secured =>{

                        const sql = 'UPDATE agent SET password = ? WHERE email = ?'
                        con.query(sql, [secured, email], (err, resu) => {
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
                                res.cookie('agent', token, {maxAge: 43200000}).redirect('/agent/dashboard')
                            }else{
                                req.flash('danger', 'incorrect Email or Password')
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
            res.cookie('agent','', {expiresIn: Date.now()})
            res.redirect('/agent/login')
        })

    return route
}

module.exports = agent()

