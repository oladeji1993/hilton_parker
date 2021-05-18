const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path')

const directory = './'

function files() {

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
        const act = `${path.dirname(directory)} + /uploads` 
        fs.readdir(act, (err, files) => {
            // files.forEach(file => {.
            console.log(path.dirname(directory))
              console.log(files);
              res.send(files)
            // })
            ;
          });
        const id = req.params.id
        
    }
    
    )

    return route
}

module.exports = files()