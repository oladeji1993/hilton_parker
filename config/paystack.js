const payStack = (request) => {
    const MySecretKey = 'Bearer sk_test_d6a5ad6a0c260f17234aea24294251f67550f3b4';
   const initializePayment = (form, myCallBack) => {

    const options = {
        url : 'https://api.paystack.co/transaction/initialize',
        headers : {
            authorization: MySecretKey,
            'content-type': 'application/json',
            'cache-control': 'no-cache'
        },
       form
    }

    const callback = (error, response, body)=>{
        return myCallBack(error, body);
    }
    request.post(options,callback);


   };

   const verifyPayment = (ref,myCallBack) => {
    const option = {
        url : 'https://api.paystack.co/transaction/verify/' + encodeURIComponent(ref),
        headers : {
            authorization: MySecretKey,
            'content-type': 'application/json',
            'cache-control': 'no-cache'
       }
    }
    const callBack = (error, response, body)=>{
        return myCallBack(error, body);
    }
    request(option,callBack);
}
    return {initializePayment, verifyPayment};
}
module.exports = payStack;