const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig');
const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path')

const directory = './uploads'

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
        
        fs.readdir(directory, (err, files) => {
            const doc = []
            files.forEach(file => {
              doc.push(file)
            })

            function search(params) {
                const id = req.params.id
                const elem = params.slice(0,2).toString()
                const stringid = id.toString()
                if(elem == stringid){
                    return params
                }
            }
            const id = req.params.id
            for(i=0; i<doc.length; i++){
                const entries = []
                entries.push(search(doc[i]))
                return entries
            }
            // const entries = search(doc, id)
            res.send(entries)
          });
        //   res.send(doc)
        
        
    }
    
    )

    return route
}

module.exports = files()