const pool = require('../config/dbconfig')

function search(req, res, next){
    const {term} = req.body
    const {table} = req.query
    pool.getConnection((err, con) => {
        const sql = `SELECT * FROM ${table} WHERE email LIKE '%${term}%'`
        con.query(sql, (err, result) => {
            if(err) console.log(err);
            req.app.locals.table = table
            req.app.locals.result = result
            // console.log(req.app.locals)
            // res.locals.searched = result
            next()
        })
    })

}

module.exports = search