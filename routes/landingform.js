const express = require('express');
const route = express.Router();
const pool = require('../config/dbconfig')

const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport')

async function newLead(params) {
    // let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport(smtpTransport({
        host: "webmail.softnoonng.com",
        tls:{
            rejectUnauthorized: false
        },
        port: 587,
        secure: false,
        auth: {
            user: 'collinswilson@softnoonng.com',
            pass: 'Newaccess@21'
        },
    }));

    let info = await transporter.sendMail({
        from: '"Collins Wilson (Node App)" <collinswilson@softnoonng.com>',
        to: 'collinswilson44@gmail.com',
        text: `
            New Application (LEAD)
            Name : ${params.name},
            email: ${params.email},
            phone: ${params.phone}
        `
    });

    console.log('message sent')
}

function landingForm(){
    route.post('/', (req, res) => {
        const params = req.body
        pool.getConnection((err, con) => {
            if (err) throw err;
    
            con.query('INSERT INTO leads SET ?', params, (err, result) => {
                con.release()
                if(!err){
                    newLead(params)
                    res.send(`user ${params.name} added to DB Successfully`)
                }else{
                    console.log(err)
                }
            })
        })
    })

    return route
} 

module.exports = landingForm()