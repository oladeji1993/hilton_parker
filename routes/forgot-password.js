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
                    const payload =  result[0].email
                    
                    const token = jwt.sign(payload, secret);
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
      // render forgot_password page
    route.get('/',(req, res) => {
        res.render('./Client/recovery');
    });

    route.post('/', (req, res, next) =>{
        const email = req.body.email;
        pool.getConnection((err, connection) => {
            if(err) throw err
            console.log(`connected as id ${connection.threadId}`)
            connection.query('SELECT * FROM leads WHERE email=?', email, (err, result) => {
                if(email !== result[0].email){
                    res.send("invalid Email")
                }
                // user exist, create one time link 
                const secret = JWT_SECRET + result[0].password;
                const payload = {
                    email: result.email,
                    id: result.id
                }

                const token = jwt.sign(payload, secret, {expiresIn: "10m"});
                const link = `http://localhost:3000/forgot-password/${result[0].id}/${token}`  
                console.log(link);
                mailers.forgot_password(result, token);
                res.send('Password reset link has been sent to your email...');

            })
        })
    })



    route.get('/:id/:token', (req, res, next) =>{
        const token = req.params.token
        const message = req.flash 
        pool.getConnection((err, con) =>{
            con.query( 'SELECT * FROM leads', (err, result) =>{
                if(result){
                    const secret = JWT_SECRET
                    const payload = jwt.verify(token, secret)
                    if(payload){
                        res.render("./Client/reset-password", {
                            message
                        })
                    }else{
                        console.log(err)
                    }
                }else{
                    console.log('i am not available')
                }
            })
        }) 
            const { id, token} = req.params;

        pool.getConnection((err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM leads WHERE id=?', id, (err, result) => {
                if( id != result[0].id){
                    res.send('invalid')
                    return;
                }

                const secret = JWT_SECRET + result[0].password
                // console.log(secret);

                try {
                    const payload = jwt.verify(token, secret)
                    res.render("./Client/reset-password", {email: result[0].email})

                } catch (error) {
                    res.redirect("/forgot-password",)
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
                if( id != result[0].id){
                    res.send('invalid')
                    return;
                }

                const secret = JWT_SECRET + result[0].password;

                if(token) {
                    jwt.verify(token, secret, (error, decodedToken) => {
                         if(error) {
                           res.send("error")
                         }
                    })
                  }

                try {

                    if(!result[0]) {
                        res.send('We could not find a match for this link');
                    }else{
                        bcrypt.hash(password, 12).then(hashed => {
                            const sql = "UPDATE leads SET password = ? WHERE id = ?" 
                            connection.query(sql, [hashed, id], (err, result) => {
                                // res.send('password successfully changed')
                                res.redirect("/user/login",)
                            })
                        })
                    }

                } catch (error) {
                    console.log(error.message)
                    res.redirect("/forgot-password",)
                }

            })
        })
    
    
    })
    return route
}

module.exports = forgot_password();