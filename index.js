const express = require('express');
const path = require('path');
const app = express();
const sql = require('mysql');
require('dotenv').config()
var cookiePasser = require('cookie-parser')



app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookiePasser({secret: process.env.TOKEN_SECRET}))


app.use(express.static(path.join(__dirname, 'assets')))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.get('/' , (req, res) => {
    res.render("index")
    console.log('cookies', req.cookies)
})



const landingForm = require('./routes/landingform');
app.use('/landingform', landingForm);

const admin = require('./routes/admin');
app.use('/admin', admin)


app.listen(3000, function(){
    console.log('app running on port 3000')
})