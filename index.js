const express = require('express');
const path = require('path');
const app = express();
const sql = require('mysql');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport')


const pool = sql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "collins",
    password: "collinsP",
    database: "hilton",
})

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

async function main(params) {
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

app.get('/' , (req, res) => {
    // res.send('hello')

    pool.getConnection((err,con) => {
        if (err) throw err;
        // console.log(con)
        con.query('SELECT * from leads', (err, result) => {
            con.release()

            if(!err){
                // res.send(result)
                res.render('index')
            }else{
                console.log(err)
            }
        })
    })
})

app.post('/landingform', (req, res) => {
    const params = req.body

    pool.getConnection((err, con) => {
        if (err) throw err;

        con.query('INSERT INTO leads SET ?', params, (err, result) => {
            con.release()
            if(!err){
                main(params)
                res.send(`user ${params.name} added to DB Successfully`)
            }else{
                console.log(err)
            }
        })
    })
})

app.listen(3000, function(){
    console.log('app running on port 3000')
})