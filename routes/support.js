const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const bcrypt = require('bcryptjs');
const { response } = require('express');

function support(){

    route.get('/', (req, res) => {
        
        pool.getConnection((err, con) => {
            con.query(`SELECT * FROM admin`, (err, admins) => {
                con.query(`SELECT * FROM agent` , (err, agents) => {
                    con.query(`SELECT * FROM leads`, (err, leads) => {
                        con.release()
                        res.render('./support/index', {
                            admins,
                            agents,
                            leads,
                            message : req.flash()
                        })
                    })
                }) 
            })
        })
        
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
                        res.status(200).json({results})
                        con.release()
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