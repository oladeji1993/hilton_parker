const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport')
const bcrypt = require('bcryptjs');

async function newLead(params) {
    let transporter = nodemailer.createTransport(smtpTransport({
        host: "webmail.softnoonng.com",
        tls:{
            rejectUnauthorized: false
        },
        port: 587,
        secure: false,
        auth: {
            user: 'collinswilson@softnoonng.com',
            pass: process.env.MAIL_PASSWORD 
        },
    }));


    let info = await transporter.sendMail({
        from: '"HILTON PARKER (Node App)" <collinswilson@softnoonng.com>',
        to: 'collinswilson@softnoonng.com',
        text: `
            New Application (LEAD)
            Name : ${params.firstname + ' ' + params.lastname},
            email: ${params.email},
            phone: ${params.phone}
            Account Officer: ${params.accountofficer}
        `
    });

    console.log('message sent') 
}


async function applied(params) {
    let transporter = nodemailer.createTransport(smtpTransport({
        host: "webmail.softnoonng.com",
        tls:{
            rejectUnauthorized: false
        },
        port: 587,
        secure: false,
        auth: {
            user: 'collinswilson@softnoonng.com', 
            pass: process.env.MAIL_PASSWORD
        },
    }));


    let info = await transporter.sendMail({
        from: '"HILTON PARKER" <collinswilson@softnoonng.com>',
        to: `${params.email}`,
        text: `
            New Application (LEAD)
            Name : ${params.firstname + ' ' + params.lastname},
            email: ${params.email},
            phone: ${params.phone}
            Account Officer: ${params.accountofficer},
            Password Link : 'http://localhost:3000/user/${params.hash}'
        `
    });

    console.log('message sent') 
}   


async function forgot_password(result, mail,token) {
    let transporter = nodemailer.createTransport(smtpTransport({
        host: "webmail.softnoonng.com",
        tls:{
            rejectUnauthorized: false
        },
        port: 587,
        secure: false,
        auth: {
            user: 'collinswilson@softnoonng.com', 
            pass: process.env.MAIL_PASSWORD
        },
    }));


    let info = await transporter.sendMail({
        from: '"HILTON PARKER" <collinswilson@softnoonng.com>',
        to: `${mail}`,
        text: `
            Your reset password mail is here
            email: ${mail},
            Password reset Link : 'http://localhost:3000/forgot-password/${result}/${token}'
        `
    });

    console.log('message sent') 
}

async function document_upload(result, mail, filename, link) {
    let transporter = nodemailer.createTransport(smtpTransport({
        host: "webmail.softnoonng.com",
        tls:{
            rejectUnauthorized: false
        },
        port: 587,
        secure: false,
        auth: {
            user: 'collinswilson@softnoonng.com', 
            pass: process.env.MAIL_PASSWORD
        },
    }));


    let info = await transporter.sendMail({
        from: '"HILTON PARKER" <collinswilson@softnoonng.com>',
        to: `${mail}`,
        subject: `${result[0].firstname}  ${result[0].lastname} Just Uploaded Document(s)`,
        text: `
            Find Download Link below
            Download Link : 'http://localhost:3000/admin/${filename}/${link}'
        `
    });

    console.log('message sent') 
}
async function contact(details) {
    let transporter = nodemailer.createTransport(smtpTransport({
        host: "webmail.softnoonng.com",
        tls:{
            rejectUnauthorized: false
        },
        port: 587,
        secure: false,
        auth: {
            user: 'collinswilson@softnoonng.com',
            pass: process.env.MAIL_PASSWORD 
        },
    }));


    let info = await transporter.sendMail({
        from: '"HILTON PARKER" <collinswilson@softnoonng.com>',
        to: 'collinswilson@softnoonng.com', 
        subject: 'Contact Form',
        text: `
            Name : ${details.firstname + ' ' + details.lastname},
            email: ${details.email},
            phone number: ${details.phonenumber},
            Message: ${details.textarea}
        `
    });

    console.log('message sent') 
}


module.exports = {newLead, applied, forgot_password, contact, document_upload};