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
    phonenumber: joi.string().min(3).max(30).required(),
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
                con.query('SELECT * FROM leads WHERE status = "new" && accountofficer = ?', id, (err, starter) =>{
                    con.query('SELECT * FROM leads WHERE status = "completeregistration" && accountofficer = ?', id, (err, complete) =>{
                        con.query('SELECT * FROM leads WHERE status = "paid" && accountofficer = ?', id, (err, paid) =>{
                            con.query('SELECT * FROM leads WHERE status = "success" && accountofficer = ?', id, (err, success) =>{
                                con.query('SELECT * FROM leads WHERE accountofficer = ?', id, (err, allUser) =>{

                                    res.render('./admin/dashboard', {
                                        starter,
                                        complete,
                                        paid,
                                        success,
                                        allUser

                                    })
                                })

                            })
                        })
                    })
                })
            })
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

        // console.log(valid)
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


        // agents details
        route.get('/details', (req, res, next,) => {
            if (req.cookies.authenticate){
                req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
                next()
            }else{
                req.flash('danger', 'You Must Login First', )
                res.redirect('/agent/login')
                } 
        }, (req, res) => {
            const id = req.user.id
            pool.getConnection((err, con) => {
                if (err) throw err;
                con.query('SELECT * FROM admin WHERE id = ?', id, (err, admin) => {
                    con.query('SELECT * FROM agent WHERE status = "new" && accountofficer = ?', id, (err, fresh) =>{
                        con.query('SELECT * FROM agent WHERE status = "submit" && accountofficer = ?', id, (err, registered) =>{
                            con.query('SELECT * FROM agent WHERE status = "verified" && accountofficer = ?', id, (err, active) =>{    
                                        res.render('./admin/agent', {
                                            fresh,
                                            registered,
                                            active,
                                            admin : admin[0]
    
                                        })
                                   
    
                              
                            })
                        })
                    })
                })
            })
        })
    



    // DASHBOARD NAVIGATION LINKS
    route.get('/newApplicants',(req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    },  (req, res) => {
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM leads WHERE status = "new" && accountofficer = ?', accountofficer, (err, userList) =>{
                if(userList.length > 0){
                    res.render('./admin/applicants', {
                        userList
                    })
                }else{
                    res.render('./admin/applicants', {
                        userList
                    })
                }
            })
        })
    })

    route.get('/completereg', (req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    },  (req, res) => {
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM leads WHERE status = "complete registration" && accountofficer = ?', accountofficer, (err, userList) =>{
                if(userList.length > 0){
                    res.render('./admin/applicants', {
                        userList
                    })
                }else{
                    res.render('./admin/applicants', {
                        userList
                    })
                }
            })
        })
    })

    route.get('/makepayment', (req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    },  (req, res) => {
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM leads WHERE status = "paid" && accountofficer = ?', accountofficer, (err, userList) =>{
                if(userList.length > 0){
                    res.render('./admin/applicants', {
                        userList
                    })
                }else{
                    res.render('./admin/applicants', {
                        userList
                    })
                }
            })
        })
    })

    route.get('/success', (req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    },  (req, res) => {
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM leads WHERE status = "success" && accountofficer = ?', accountofficer, (err, userList) =>{
                if(userList.length > 0){
                    res.render('./admin/applicants', {
                        userList
                    })
                }else{
                    res.render('./admin/applicants', {
                        userList
                    })
                }
            })
        })
    })



    route.get('/home', (req, res) => {
        res.redirect('/admin/dashboard')
    })


    // agent details route

    route.get('/newagents', (req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    }, (req, res) => {
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM admin WHERE id = ?', accountofficer, (err, admin) => {
                con.query('SELECT * FROM agent WHERE status = "new" && accountofficer = ?', accountofficer, (err, agentList) =>{
                    if(agentList.length > 0){
                        res.render('./admin/userList', {
                            agentList,
                            admin: admin[0]
                        })
                    }else{
                        res.render('./admin/userList', {
                            agentList,
                            admin: admin[0]
                        })
                    }
                })
            })
        })
    })

    route.get('/doc_upload', (req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    }, (req, res) => {

        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM admin WHERE id = ?', accountofficer, (err, admin) => {
                con.query('SELECT * FROM agent WHERE status = "submit" && accountofficer = ?', accountofficer, (err, agentList) =>{
                    if(agentList.length > 0){
                        res.render('./admin/userList', {
                            agentList,
                            admin: admin[0]
                        })
                    }else{
                        res.render('./admin/userList', {
                            agentList,
                            admin: admin[0]
                        })
                    }
                })
            })
        })
    })

    route.get('/verifiedagents', (req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    },  (req, res) => {
        const accountofficer = req.user.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
            con.query('SELECT * FROM admin WHERE id = ?', accountofficer, (err, admin) => {
                con.query('SELECT * FROM agent WHERE status = "verified" && accountofficer = ?', accountofficer, (err, agentList) =>{
                    if(agentList.length > 0){
                        res.render('./admin/userList', {
                            agentList,
                            admin : admin[0]
                        })
                    }else{
                        res.render('./admin/userList', {
                            agentList,
                            admin : admin[0]
                        })
                    }
                })
            })
        })
    })

    route.get('/activeagents', (req, res) => {
        res.render('./admin/userList', {
            admin : admin[0]
        })
    })

    route.get('/agentdetails/:id', (req, res, next,) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/agent/login')
            } 
    },  (req, res) => {
        const id = req.params.id
        pool.getConnection((err, con) =>{
            if (err) res.redirect('/')
                con.query('SELECT * FROM agent WHERE id = ?', id, (err, info) =>{
                    if(info.length > 0){
                        res.render('./admin/agentdetails', {
                            info : info[0]
                        })
                    }else{
                        res.render('./admin/agentdetails', {
                            info
                        })
                    }
                })
        })
    })

    
    route.post('/verify/:id', (req, res, next) =>{
        const id = req.params.id
        pool.getConnection((err, con)=>{
            con.query('SELECT * FROM agent WHERE id = ?', id, (err, agent) =>{
                if(agent.length > 0){
                    con.query('UPDATE agent SET status = "verified" WHERE id = ?', id, (err, resu) =>{
                        console.log(resu)
                    })
                }else{
                    console.log("not done")
                }
            })
        })
 
    } )


    
       
        
    return route
}

module.exports = admin();