const mysql = require('mysql2');

const connection = mysql.createConnection({
	host : 'localhost',
	database : 'autohub_database',
	user : 'root',
	//password : ''
    port:3306
});

connection.connect(function(error){
	if(error)
	{
		throw error;
	}
	else
	{
		console.log('MySQL Database is connected Successfully');
	}
});

module.exports = connection;