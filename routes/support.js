const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const bcrypt = require('bcryptjs');
// require('dotenv').config()
const jwt = require('jsonwebtoken');
const { constant } = require('lodash');

function support(){

    route.use((req, res, next) => {
       
        if (req.cookies.suppauth ){
            const techie  = jwt.verify(req.cookies.suppauth, process.env.TOKEN_SECRET)
            pool.getConnection((err, con) => {
                if(err){
                    res.render('error')
                }else{
                    con.query('SELECT * FROM support WHERE id = ?', techie.id, (err, result) => {
                        con.release()
                        if(result.length > 0.5){
                            next()
                        }else{
                            req.flash('danger', 'You Must Login First', )
                            res.render('./support/login', {
                                message: req.flash()
                            })
                        }
                    })
                }
            })
            }else{
            req.flash('danger', 'You Must Login First', )
            res.render('./support/login', {
                message: req.flash()
            })
            } 
    })

    route.get('/regbdo', (req, res) => {
        res.render('./bdo/sign-up')
    })

    //GET REGISTER AGENT OFFICER FORM
    route.get('/agofficer', (req, res) => {
        pool.getConnection((err, con) => {
            if (err) {
                res.render('./error')
            }else{
                con.query('SELECT * FROM bdo', (err, bdo) => {
                    if(err){
                        res.render('./error')
                    }else{
                        if(bdo.length < 0.5){
                            req.flash('danger', 'Agent Officers are supposed to be with BDO, register BDO first')
                            res.redirect('/support')
                        }else{
                            res.render('./agentofficer/sign-up', {
                                bdo
                            })
                        }
                    }
                })
            }
        })
    })

      //POST REGISTER BDO OFFICER FORM
    route.post('/regbdo', (req, res) => {
        const details = Object.values(req.body)
        pool.getConnection( (err, con) => {
            if(err){
                res.status(500).render('./error')
            }else{
                con.query('SELECT * FROM bdo WHERE email = ?', req.body.email, async(err, result) => {
                    if(result.length > 0.5){
                        req.flash('warning', 'Email already exists')
                        res.redirect('/support')
                    }else{
                        const hashedpassword = await bcrypt.hash(req.body.password, 12)
                        const sql = `INSERT INTO bdo SET 
                        firstname = '${req.body.firstName}',
                        lastname = '${req.body.lastName}',
                        email = '${req.body.email}',
                        phonenumber = '${req.body.phonenumber}',
                        password = '${hashedpassword}'
                         `
                        con.query(sql, details, (err, done) => {
                            if(err){
                                console.log(err)
                                req.flash('danger', 'Internal Server Error')
                                res.status(500).redirect('/support')
                            }else{
                                req.flash('success', 'User Added')
                                res.redirect('/support')
                            }
                        })
                    }
                })
            }
        })
    })

          //POST REGISTER AGENT OFFICER FORM
    route.post('/regagofficer',  (req, res) => {
        pool.getConnection( async (err, con) => {
            if(err){
                res.status(500).render('./error')
            }else{
                const password = req.body.password
                const passwordhash = await bcrypt.hash(password, 12)
                const sql = `INSERT INTO agentofficer SET 
                firstname = '${req.body.firstName}',
                lastname = '${req.body.lastName}',
                email = '${req.body.email}',
                phonenumber = '${req.body.phonenumber}',
                password = '${passwordhash}',
                bdo = '${req.body.bdo}'
                 `
                con.query(sql, (err, done) => {
                    if(err){
                        console.log(err)
                        res.status(500).render('./error')
                    }else{
                        req.flash('success', 'User Added')
                        res.redirect('/support')
                    }
                })
            }
        })
    })

    route.get('/logout', (req, res) => {
        res.cookie('suppauth','');
        res.redirect('/support')
    })

    route.post('/updateuser', (req, res) => {
        const status = req.body.status
        const accountofficer = req.body.accountofficer
        const id = req.query.id
        pool.getConnection((err, con) => {
            const sql = `UPDATE leads SET status = '${status}', accountofficer = '${accountofficer}' WHERE id = ${id}`
            con.query(sql, (err, result) => {
                if(err){
                    console.log(err)
                    res.send(err)
                }else{

                    req.flash('success', 'Data updated successfully')
                            res.redirect('/support')
                }
            })
        })
    })
    route.get('/', (req, res) => {
        
        pool.getConnection((err, con) => {
            con.query(`SELECT * FROM admin`, (err, admins) => {
                con.query(`SELECT * FROM agent` , (err, agents) => {
                    con.query(`SELECT * FROM leads`, (err, leads) => {
                        con.query(`Select * FROM bdo`, (err, bdo) => {
                            con.query(`Select * FROM agentofficer`, (err, agofficer) => {
                                con.release()
                                res.render('./support/index', {
                                    admins,
                                    agents,
                                    leads,
                                    bdo,
                                    agofficer,
                                    message : req.flash()
                                })
                            })
                        })
                    })
                }) 
            })
        })
        
    })

    route.post('/updateagent', (req, res) => {
        const data = req.body.accountofficer
        const id = req.query.id
        if(data != undefined){

            pool.getConnection((err, con) => {
                const sql = `UPDATE agent SET accountofficer = ${data} WHERE id = ${id} `
                con.query(sql, (err, result) => {
                    con.release()
                    if(err){
                        req.flash('danger', 'Internal Server Error', )
                        res.redirect('/support')
                    }else{
                        req.flash('success', 'Data updated successfully')
                        res.redirect('/support')
                    }
                })
            })
        }else{
            req.flash('danger', 'Invalid Operation', )
            res.redirect('/support')
        }
    })

    route.post('/update', (req, res) => {
        const table = req.query.table
        const id = req.query.id
        const data = Object.values(req.body)
        pool.getConnection((err, con) => {
            const sql = `UPDATE ${table} SET firstname = ?, lastname = ? , email = ? , phonenumber = ? WHERE id = ${id}`
            con.query(sql, data, (err, result) => {
                con.release()
                if(err){
                    req.flash('danger', 'Internal Server Error', )
                    res.redirect('/support')
                }else{
                    req.flash('success', 'Data updated successfully')
                    res.redirect('/support')
                }
            })
        })
    })

    route.post('/delete', (req, res) => {
        const table = req.query.table
        const id = req.query.id
        // res.send(table)
        pool.getConnection((err, con) => {
            const query = ``
            con.query(`DELETE FROM ${table} WHERE id = ${id}`, (err, response) => {
                if(err){
                    res.send(err)
                }else{
                    res.send(response)
                }
            })
        })
    })

    route.get('/register',
       (req,res) => {
        res.render('./admin/sign-up')
       })

    route.post('/update/password', (req, res) => {
        const id = req.query.id
        const table = req.query.table
        const password = req.body.newpassword
        bcrypt.hash(password, 12).then(hashedpassword => {
            pool.getConnection((err, con) => {
                con.query(`UPDATE ${table} SET password = ? WHERE id = ${id}`, hashedpassword , (err, result) => {
                    if(err){
                        req.flash('danger', 'Internl server Error')
                        res.redirect('/support')
                    }else{
                        req.flash('success', 'Update Successfull')
                        res.redirect('/support')
                    }
                })
            })
        })
    })

    route.get('/accountofficer', (req, res) => {
        const table = req.query.table
        const id = req.query.id
        const query = `SELECT * FROM ${table} WHERE id = ${id}`
        pool.getConnection((err, con) => {
            con.query(query, (err, result) => {
                res.status(200).json({
                    admin : result
                })
            })
        })
        
    })

    route.get('/getall', (req, res) => {
        const table = req.query.table
        const sql = `SELECT * FROM ${table}`
        pool.getConnection((err, con) => {
            con.query(sql , (error, result) => {
                res.status(200).json({
                    admin : result
                })
            })
        })
    })

    route.get('/getone', (req, res) => {
        const table = req.query.table
        const id = req.query.id
        const query = `SELECT * FROM ${table} WHERE id = ${id}`
        pool.getConnection((err, con) => {
            con.query(query, (err, result) => {
                res.render('./support/single' , {
                    result
                })
            })
        })
    })

    route.get('/:file', (req, res) => {
        // res.status(200).json('Lorem50')
        const variable = req.params.file
        if (variable == 'admin'){
            // query admin table from db
            pool.getConnection((err, con ) => {
                if(err){
                    res.status(500).json({
                        message: 'An Error occoured'
                    })
                }else{
                    con.query(`Select * FROM admin`, (err, results) => {
                        res.status(200).json({results})
                        con.release()
                    })
                }
            })
        }else if (variable == 'bdo'){
            //query agents table
            pool.getConnection((err, con ) => {
                if(err){
                    res.status(500).json({
                        message: 'An Error occoured'
                    })
                }else{
                    con.query(`Select * FROM bdo`, (err, results) => {
                        res.status(200).json({results})
                        con.release()
                    })
                }
            })
        }else if (variable == 'agent'){
            //query agents table
            pool.getConnection((err, con ) => {
                if(err){
                    res.status(500).json({
                        message: 'An Error occoured'
                    })
                }else{
                    con.query(`Select * FROM agent`, (err, results) => {
                        res.status(200).json({results})
                        con.release()
                    })
                }
            })
        }else if (variable == 'leads'){
            //query leads table
            pool.getConnection((err, con ) => {
                if(err){
                    res.status(500).json({
                        message: 'An Error occoured'
                    })
                }else{
                    con.query(`Select * FROM leads`, (err, results) => {
                        con.release()
                        res.status(200).json({results})
                        
                    })
                }
            })
        }else{
            res.status(404).json({
                message: 'No data found'
            })
        }
    })

    return route
}

module.exports = support()