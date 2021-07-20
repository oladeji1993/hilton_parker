const express = require('express');
const route = express.Router();
// const pool = require('../config/dbconfig')
// const mailers = require('../services/mailers')



function staff(){
   route.get('/', (req, res) => {
       res.render('./staff/staffPage')
   })

   route.post('/', (req, res) => {
       const role = req.body.role
       res.redirect(`/${role}`)
   })
    return route
} 

module.exports = staff()