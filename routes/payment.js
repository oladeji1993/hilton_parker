const express = require('express');
const request = require('request');
const route = express.Router();
const _ = require('lodash');
const { response } = require('express');
const {initializePayment, verifyPayment} = require('../config/paystack')(request);


function makePayment(){

    // render payment page
    route.get('/',(req, res) => {
        res.render('./Client/payment');
    });

    // Get details from Form

    route.post('/paystack', (req, res) => {
        console.log(req.body)
        const form = _.pick(req.body,['amount','email','full_name','payment_Type']);
        form.metadata = {
            full_name : form.full_name,
            payment_Type : form.payment_Type,

        }
        form.amount *= 100
        initializePayment(form, (error, body)=>{
            if(error){
                //handle errors
                console.log(error);
                return;
            }
            details = JSON.parse(body);
            console.log(details)
            res.redirect(details.data.authorization_url)
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