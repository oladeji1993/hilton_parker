const express = require('express');
const request = require('request');
const route = express.Router();
const _ = require('lodash');
const { response } = require('express');
const pool = require('../config/dbconfig');
const {initializePayment, verifyPayment} = require('../config/paystack')(request);


function makePayment(){

    // render payment page
    route.get('/', (req, res, next)  => {
        if(req.user){
            next()
        }else{
            req.flash('danger', 'You must login first')
            res.redirect('/user/login')
        }
    },(req, res, ) => {
        const message = req.flash()     
        const userid = req.user.id
        pool.getConnection((err, con) => {
            con.query('SELECT * FROM leads WHERE id = ? ', userid, (err, user) => {
                res.render('./Client/payment', {
                    user : user[0],
                    message
            
                });
            })
        })
    });

    // Get details from Form

    route.post('/paystack', (req, res) => {
        const email = req.body.email
        console.log(email)
        const form = _.pick(req.body,['amount','email','full_name','payment_Type']);
        form.metadata = {
            full_name : form.full_name,
            payment_Type : form.payment_Type,

        }
        form.amount *= 100
        initializePayment(form, (error, body)=>{
            if(error){

                return;
            }
            pool.getConnection((err, con)=>{
                con.query('UPDATE leads SET status = "pending" WHERE email = ?', email, (err, output)=>{
                    con.query('SELECT * FROM leads WHERE email = ? ', email, (err, resu) => {
                    if(resu.length > 0){
                        details = JSON.parse(body);
                        res.redirect(details.data.authorization_url)
                    }else{
                        req.flash('danger', 'Payment Failed')
                        res.redirect('/pay')
                    }
                })
            })
            })
        });
    });


    route.get('/paystack/callback', (req,res) => {
        const ref = req.query.reference;
        verifyPayment(ref, (error,body)=>{
            if(error){
                //handle errors appropriately
                console.log(error)
                res.send('error occur');
            }
            response = JSON.parse(body);
            const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name', 'payment_Type']);
            [reference, amount, email, full_name, payment_Type] =  data;
            newApplicant = {reference, amount, email, full_name, payment_Type}
            const applicant = new Applicant(newApplicant)
            applicant.save().then((applicant)=>{
                if(!applicant){
                    res.send('error occur');
                }
                res.redirect('/receipt/'+applicant._id);
            }).catch((e)=>{
                res.send('error occurred');
           });
        });
    });

    return route
}

module.exports = makePayment();