const { Router } = require("express");
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require('../config/dbconfig')
const route = express.Router();
var flash = require('express-flash');
const mailers = require("../services/mailers");
const bcrypt = require('bcryptjs');
require("dotenv")


const app = express();

app.use(express.json())
app.use(flash());
app.use(express.urlencoded({extended: false}))
app.set('view engine', "ejs")


const JWT_SECRET = process.env.TOKEN_SECRET;



function forgot_password() {


    route.get('/',  (req, res) => {
       const message = req.flash()
        console.log(message)
        res.render('./Client/recovery', {
            message: message
        }) 
    }
    )

    route.post('/' , (req, res) => {
        const email = req.body.email
        pool.getConnection((err, con) => {
            if(err) throw err;
            con.query('SELECT * FROM leads WHERE email = ?', email, (err, result) => {
                // console.log(result[0])
                if (err) throw err;
                if (result.length > 0) {
                    const secret = JWT_SECRET
                    const payload = {
                        email: result[0].email,
                        id: result[0].id
                    }
                    const token = jwt.sign(payload, secret, {expiresIn: "20m"});
                    const link = `http://localhost:3000/forgot-password/${result[0].id}/${token}`  
                    console.log(link);
                    mailers.forgot_password(result, token);
                    req.flash('warning', 'Password reset link has been sent to your email...', )
                    res.redirect("/user/login")

                }else{
                    // console.log('not available')
                    req.flash('danger', 'Email does not exist...')
                    res.redirect("/forgot-password")
                    // res.send("not available")
                }

            })
        })
    })



    route.get('/:id/:token', (req, res, next) =>{
        const token = req.params.token

        pool.getConnection((err, con) =>{
            con.query( 'SELECT * FROM leads', (err, result) =>{
                if(result){
                    const secret = JWT_SECRET
                    const payload = jwt.verify(token, secret)
                    if(payload){
                        res.render("./Client/reset-password",)
                    }else{
                        console.log(err)
                    }
                }else{
                    console.log('i am not availabl')
                }
            })
        }) 
    
    })

    route.post('/:id/:token', (req, res, next) =>{
        const id= req.params.id;
        const token = req.params.token;
        const {password} = req.body;
    
       
        pool.getConnection((err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM leads WHERE id=?', id, (err, result) => {
                if( id == result[0].id){
                    bcrypt.hash(password, 12).then(hashed => {
                    const sql = "UPDATE leads SET password = ? WHERE id = ?" 
                    connection.query(sql, [hashed, id], (err, result) => {
                    req.flash('warning', 'Password Updated successfully.', )
                    res.redirect("/user/login",)
                })
            })
                }else{
                    req.flash('danger', 'We could not find a match for this link', )
                    res.redirect("/user/login",)
                }

            })
        })
    
    
    })
    return route
}

module.exports = forgot_password();