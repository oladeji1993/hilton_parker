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

    route.get('/pay',  (req, res, next) => {
        if(req.cookies.agent){
            req.user =jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You need to login first')
            res.redirect('/agent/login')
        }
    }, (req, res) => {
        pool.getConnection((err, con)=> {
            con.query('SELEcT * FROM agent WHERE id = ?', req.user.id, (err, ret) => {
                const ag = ret[0].agent_id
                con.query('SELECT * FROM leads WHERE agent_id = ?', ag, (err, result) => {
                    res.render('./agent/clients', {
                        data: result
                    })
                })
            })
           
        })
    })
    route.get('/pay/:id',(req, res, next) => {
        if(req.cookies.agent){
            req.user =jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You need to login first')
            res.redirect('/agent/login')
        }
    }, (req, res) => {
        const id = req.params.id
        const userid = req.user.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE id = ? ', id, (err, user) => {
                con.query('SELECT * FROM agent WHERE id = ?', userid, (err, agent) => {
                    res.render('./payment', {
                        agent : agent[0],
                        user : user[0]
                    });
                })
                
            })
        })
    });

    route.get('/all', (req, res, next) => {
        if(req.cookies.agent){
            req.user =jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You need to login first')
            res.redirect('/agent/login')
        }
    }, (req, res) => {
        const sql1 = 'SELECT * FROM agent WHERE id = ?'
        const sql2 = `
            SELECT * FROM leads WHERE agent_id  = ?
        `
        pool.getConnection((err, con) => {
            con.query(sql1, req.user.id, (err, ag) => {
                const agen = ag[0]
                if(agen){
                    con.query(sql2, agen.agent_id, (err, results) => {
                        res.render('./agent/clients', {
                            data: results
                        })
                    }
                    )
                }else{
                    res.render('error')
                }
                
            } )
        })
    })
    
    route.get('/complete', (req, res, next) => {
        if(req.cookies.agent){
            req.user =jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You need to login first')
            res.redirect('/agent/login')
        }
    }, (req, res) => {
        const sql1 = 'SELECT * FROM agent WHERE id = ?'
        const sql2 = `
            SELECT * FROM leads WHERE agent_id = ? AND status = ?
        `
        pool.getConnection((err, con) => {
            con.query(sql1, req.user.id, (err, ag) => {
                const agen = ag[0]
                if(agen){
                    con.query(sql2, [agen.agent_id, 'complete'], (err, results) => {
                        res.render('./agent/clients', {
                            data: results
                        })
                    }
                    )
                }else{
                    res.render('error')
                }
                
            } )
        })
    })

    route.post('/newclient', upload.none(),(req, res) => {
        const fields = Object.values(req.body)
        const sql = `
            INSERT INTO leads SET
            lastname = ?,
            firstname = ?,
            othername = ?,
            address = ?,
            dateofbirth = ?,
            email = ? ,
            phonenumber = ? ,
            placeofbirth = ?,
            gender = ? ,
            maritalstatus = ? ,
            program = ?,
            agent_id = ?,
            accountofficer = ?,
            regdate = ?, 
            status = 'new' 

        `

        pool.getConnection((err, con) => {
            if (req.cookies.agent){
                req.user =jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
                con.query('SELECT * FROM agent WHERE id = ? ', req.user.id, (err, agents) => {
                    fields.push( agents[0].accountofficer)
                    fields.push((new Date()).toLocaleDateString('en-US'))
                    con.query('SELECT * FROM leads WHERE email = ?', req.body.email, (err, result) => {
                        if(result.length > 0){
                            req.flash('warning', 'This email has already been registered')
                            res.redirect('/agent/newclient')
                        }else if(req.body.program == 'none'){
                            req.flash('warning', 'Select a valid program')
                            res.redirect('/agent/newclient')
                        }
                        else{
                            con.query(sql, fields, (err, result) => {
                                con.query('SELECT * FROM leads WHERE email = ? ', req.body.email, (err, cavani) => {
                                    res.cookie('agent_user', [cavani[0].agent_id,cavani[0].id] , {maxAge: 86400000})
                                res.render('./agent/apply', {
                                    user: cavani[0]
                                })
                                })
                            })
                        }
                    })
                    
                })
            }else{
                req.flash('info', 'Session expired login again' )
                res.redirect('/agent/login')
            }
            
            })
           
        
    })
    route.get('/newclient', (req, res, next) => {
        if(req.cookies.agent){
            req.user = jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            next()
        }else{
            res.render('./agent/login', {
                message : req.flash()
            })
            }
    } , (req, res) => {
        const user = req.user.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM agent WHERE id = ?', user, (err, agent) => {
                if(agent.length > 0){

                    res.render('./agent/newclient', {
                        message : req.flash(),
                        agent : agent[0]
                    })
                }else{
                    res.render('error')
                }
            })
        })
        
    })

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
        if (req.cookies.agent){
            req.user = jwt.verify(req.cookies.agent, process.env.TOKEN_SECRET)
            pool.getConnection((err, con) => {
                con.query('SELECT * FROM agent WHERE id = ?', req.user.id, (err, rest) => {
                    const earnings = 20/100 * rest[0].payment
                    con.query(`SELECT * FROM admin WHERE id = ${rest[0].accountofficer}`, (err, acct) => {
                        con.query('SELECT * FROM leads WHERE agent_id = ?', rest[0].agent_id, (err, all) => {
                            con.query('SELECT * FROM leads WHERE status = ? AND agent_id = ? ', ['completed', rest[0].agent_id] , (err, complete) => {
                                res.render('./agent/dashboard', {
                                    complete,
                                    earnings,
                                    applicant: all,
                                    agent : rest[0],
                                    accountofficer : acct[0]
                                })
                            })
                           
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
                            res.redrect('agent/dashboard')
                        }else if(user[0].status == 'submit'){
                            req.flash('primary', 'Your application is still pending')
                            res.redirect('/agent')
                        }
                        else{
                            con.query(`SELECT * FROM agentofficer `, (err, agofficer) => {
                                res.render('./agent/reg', {
                                    agofficer,
                                    user: user[0]
                                })
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
        const email = params.email
        pool.getConnection((err, con) => {
        con.query('SELECT * FROM agent WHERE email = ? ', email, (err, respons) => {
            if(respons.length < 0.5){
                res.render('./error')    
           
            }else{
                const ref = 'HPSAG00' + respons[0].id
                pool.getConnection((err, con) => {

                    let sql = `UPDATE agent SET
                    residentialaddress = '${req.body.officeaddress}',
                    status = 'applied',
                    agent_id = '${ref}',
                    agofficer = '${req.body.agofficer}'
                    WHERE id = ${respons[0].id}`;
                    con.query(sql, (err, result) => {
                        if(result){
                            con.query('SELECT * FROM agent WHERE id = ? ', respons[0].id, (err, resp) => {
                                res.cookie('agent_id', ref, {maxAge: 12800000}).redirect('/agent/uploads')
                            })
                           
                        }else if(err){
                            res.render('error')
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

    // var cpUpload = upload.fields([{ 
    //     name: 'g1_id', maxCount: 1 },
    //     {
    //         name:'g1_passport', maxCount: 1
    //     },
    //     {
    //         name:'g2_id', maxCount: 1
    //     },
    //     {
    //         name:'g2_passport', maxCount: 1
    //     }
    // ])
    route.post('/uploads/:id', upload.none(), (req, res) => {
        pool.getConnection((err, con) => {
            const agent = req.cookies.agent_id
            con.query('SELECT * FROM agent WHERE agent_id = ? ', agent, (err, result) => {
                const fields = Object.values(req.body);
                const lead = result[0]
                const accountofficerid = result[0].accountofficer
                fields.push(agent)
                const sql = `UPDATE agent SET g1_fullname = ?,
                g1_address =?,
                g1_phone =?,
                g1_email =?,
                g2_fullname =?,
                g2_address =?,
                g2_phone =?,
                g2_email =?,
                status = 'submit'
                WHERE agent_id = '${agent}'`
                con.query(sql, fields,(err, resp) => {
                    con.release()
                    pool.getConnection((err, con) => {
                        con.query('SELECT * FROM admin WHERE id =?', accountofficerid, (err, admin)  => {
                            const email = admin[0].email
                            mailers.notify(lead, email)
                            mailers.received(result[0])
                            res.render('./success')
                        })
                    })
                  
                   
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

