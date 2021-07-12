const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path')

const directory = './assets/uploads'

function files() {

    route.get('/download/:filename', (req, res, next) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/admin/login')
            } 
    }, (req, res) => {
        const {filename} = req.params
        // const filepath = directory + '/' + filename
        const filelink = path.join(__dirname, '../assets/uploads/academics',filename)
        res.sendFile(filelink)
        // res.download(filepath)
    })

    route.get('/', (req, res) => {
        res.render('error')
    })

    route.get('/:id', (req, res, next) => {
        if (req.cookies.authenticate){
            req.user = jwt.verify(req.cookies.authenticate, process.env.TOKEN_SECRET)
            next()
        }else{
            req.flash('danger', 'You Must Login First', )
            res.redirect('/admin/login')
            } 
    }, (req, res) => {
        
        fs.readdir(directory, (err, files) => {
            const doc = []
            files.forEach(file => {
              doc.push(file)
            })

            const id = req.params.id
            const entries = []
            for (var i =0; i<doc.length; i++){
                const j = doc[i].slice(0,2)
                if(j == id){
                    entries.push(doc[i])
                }
            }
            pool.getConnection((err, con ) => {
                con.query('SELECT * FROM leads WHERE id =? ', id, (err, user) => {
                    res.render('./admin/files',{
                        files : entries,
                        user : user[0]
                })
            })
            
            }
            )
          });
        
        
    }

    
    )

    return route
}

module.exports = files()