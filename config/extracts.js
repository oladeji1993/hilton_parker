const dayjs = require('dayjs')
const pool = require('./dbconfig')

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function schedule(){
    const date = dayjs()
    const next = addDays(date, 1)
    const tommorow = dayjs(next).format('DD/MM/YYYY')
    const lastdate = addDays(date, 15)
    const invite =  dayjs(lastdate).format('DD/MM/YYYY')
    return {appointmentEnd : invite, appointmentstart: tommorow}
}
module.exports = schedule