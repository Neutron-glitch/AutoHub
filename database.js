const mysql = require('mysql2');

const connection = mysql.createConnection({
	host : 'localhost',
	database : 'testing',
	user : 'root',
	//password : ''
    port:3307
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