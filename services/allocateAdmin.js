const pool = require('../config/dbconfig')

function allocateAdmin() {
    pool.getConnection((err, con) => {
        if(err) throw err;
        con.query('SELECT * FROM admin', (err, results) => {
            results.sort((a, b) => {
                return a.client - b.client;
            })
            con.query('SELECT * FROM admin WHERE email = ?', results[0].email, (err, res) => {
                const update =res[0].client + 1
                id = res[0].id
                con.query(`UPDATE admin SET client =? WHERE id = ${id}`,update , (err, ress) => {
                    con.release()
                } )
            } )
        } )
        })
        return id
}

module.exports = allocateAdmin