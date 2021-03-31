const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport')

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
            pass: 'Newaccess@21'
        },
    }));


    let info = await transporter.sendMail({
        from: '"Collins Wilson (Node App)" <collinswilson@softnoonng.com>',
        to: 'collinswilson@softnoonng.com',
        text: `
            New Application (LEAD)
            Name : ${params.name},
            email: ${params.email},
            phone: ${params.phone}
        `
    });

    console.log('message sent')
}

module.exports = {newLead};