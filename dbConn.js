const sql = require('mssql/msnodesqlv8')

const config = {
    user: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    server: process.env.DBSERVERNAME,
    database: process.env.DBNAME,
    options: {
        enableArithAbort: true,
    }
}

const localConnString = "server=.\\sqlferma;Database=AcademicResultsDB;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

const sqlConn = new sql.connect(localConnString)
  .then(pool => {
    return pool
  })
  .catch(err => {
    console.log('Database Connection Failed! Bad Config: ', err)
    process.exit()
  })

module.exports = {
  sql, sqlConn
}