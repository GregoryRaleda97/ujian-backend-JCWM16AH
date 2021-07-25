const mysql = require("mysql");

const connection = mysql.createConnection({
    port: 3306,
    user: "root",
    host: "localhost",
    password: "Longmarch97",
    database: "backend_2021"
});

connection.connect((err)=>{
    if(err){
        console.log(err);
        return;
    }
    console.log(`connected as id ${connection.threadId}`)
});

module.exports = connection;