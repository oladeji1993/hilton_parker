const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const sql = require('mysql');
const pool = require('./config/dbconfig');
const flash = require('express-flash')
require('dotenv').config()
const passport = require('passport');
const cookiePasser = require('cookie-parser')

app.use(session({ secret: process.env.TOKEN_SECRET }));
app.use(cookiePasser(process.env.TOKEN_SECRET));
app.use(flash());

// PASSPORT AUTHENTICATION
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function (user, done) {
    console.log('serializing user:', user[0]);
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    console.log('deserializing user:', id);
    done(null,{id});
});




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

app.get('/contact', (req, res) => {
    res.render('./Client/contactus')
})



const landingForm = require('./routes/landingform');
app.use('/landingform', landingForm);

const admin = require('./routes/admin');
app.use('/admin',admin)

const makePayment = require('./routes/payment');
app.use('/pay', makePayment)


const user = require('./routes/user')
app.use('/user', user)


const forgot_password = require('./routes/forgot-password')
app.use('/forgot-password', forgot_password);

app.listen(3000, function(){
    console.log('app running on port 3000')
})