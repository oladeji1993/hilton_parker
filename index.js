const express = require('express');
const path = require('path');
const app = express();
const sql = require('mysql');
require('dotenv').config()


const pool = sql.createPool({
    connectionLimit: 10,
    host: process.env.HOST,
    user: process.env.USER_NAME,
    password: process.env.PASSWORD,
    database: process.env.DB,
})

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));



app.use(express.static(path.join(__dirname, 'assets')))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.get('/' , (req, res) => {
    res.render("index")
})



const landingForm = require('./routes/landingform');
app.use('/landingform', landingForm);


app.listen(3000, function(){
    console.log('app running on port 3000')
})