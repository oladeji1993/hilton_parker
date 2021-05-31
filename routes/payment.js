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
                    agent: false,
                    message

            
                });
            })
            })
    });

    // Get details from Form

    route.post('/paystack', (req, res) => {
        if(req.body.agent_id){
            const form = _.pick(req.body,['amount','email','full_name','payment_Type', 'agent_id']);
            pool.getConnection((err, con) => {
                const sql1 = 'SELECT * FROM leads WHERE email = ?'
                const sql2 = 'SELECT * FROM agent WHERE agent_id = ?'
                const sql3 = 'UPDATE leads SET status = ? WHERE id = ?'
                const sql4 = 'UPDATE agent SET payment = ? WHERE id = ?'
                con.query(sql1, form.email, (err, users) => {
                    const user = users[0]
                    con.query(sql2, form.agent_id, (err, agents) => {
                        const agent = agents[0]
                        con.query(sql3, ['paid', user.id], (err, result) => {
                            const dbamount = parseInt(agent.payment)
                            const formamount = parseInt(form.amount)
                            const amount = parseInt(dbamount + formamount)
                            console.log(amount)
                            con.query(sql4, [amount, agent.id], (err, result) => {
                                form.metadata = {
                                    full_name : form.full_name,
                                    payment_Type : form.payment_Type,
                    
                            }
        form.amount *= 100;
        initializePayment(form, (error, body)=>{
            if(error){
                //handle errors
                console.log(error);
                return;
            }
            details = JSON.parse(body);
            res.redirect(details.data.authorization_url)
        });
                            })
                        })
                    })
                })
            })
            
        }else{
        const form = _.pick(req.body,['amount','email','full_name','payment_Type']);
        form.metadata = {
            full_name : form.full_name,
            payment_Type : form.payment_Type,
        }
        form.amount *= 100;
        const email = form.email
        pool.getConnection((err, con)=>{
            con.query('UPDATE leads SET status = "pending" WHERE email = ?', email, (err, output) =>{
                
                initializePayment(form, (error, body)=>{
                    if(error){
        
                        return;
                    }
                    details = JSON.parse(body);
                    res.redirect(details.data.authorization_url)
                });
            })
        })
     
        }
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