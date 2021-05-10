const { Router } = require("express");
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require('../config/dbconfig')
const route = express.Router();
// const mailers = require("./services/mailer");
require("dotenv")


const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.set('view engine', "ejs")


const JWT_SECRET = process.env.TOKEN_SECRET;



function forgot_password() {
      // render forgot_password page
    route.get('/',(req, res) => {
        res.render('./Client/recovery');
    });

    route.post('/', (req, res, next) =>{
        const email = req.body.email;
        // console.log(email);
        pool.getConnection((err, connection) => {
            if(err) throw err
            console.log(`connected as id ${connection.threadId}`)
            connection.query('SELECT * FROM leads WHERE email=?', email, (err, result) => {
                // console.log(result)
                if(email !== result[0].email){
                    res.send("invalid Email")
                }
                // user exist, create one time link 
                const secret = JWT_SECRET + user.password;
                const payload = {
                    email: user.email,
                    id: user.id
                }

                const token = jwt.sign(payload, secret, {expiresIn: "15m"});
                const link = `http://localhost:3000/reset-password/${user.id}/${token}`
                console.log(link);
                mailers.sendMail(user, token);
                res.send('Password reset link has been sent to your email...');

            })
        })
    
    })



    return route
}

module.exports = forgot_password();