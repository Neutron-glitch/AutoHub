const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs')
const path = require('path');
const https = require('https');
const { connect } = require('http2');


const app = express()


const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: 'autohub_database',
	multipleStatements: true,
	port: 3306
});

app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './public/css')));
app.use(express.static(path.join(__dirname, './public/js')));

app.set('view engine', 'ejs')


app.get('/home', (req, res) => {
	if (req.session.loggedin) {
		connection.query('select * from appointments where completion_time IS NULL',(err,results)=>{
			if(err) throw err
			res.render('wProfile',{  profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results,num:services_num,prob:"" })
		})
	}
	else res.render('login')
})

app.get('/parts&services',(req,res)=>{
	if (req.session.loggedin) {
		let profileName=req.session.name
		let profileEmail=req.session.email
		let results1
		let results2
		connection.query('SELECT * FROM parts where workshop_email=?',[profileEmail], (err,results)=>{
			if(err) throw err
			results1=results
			console.log(results1)
			connection.query('SELECT * FROM services where workshop_email=?',[profileEmail], (err,results)=>{
				if(err) throw err
				results2=results
				console.log(results2)
				res.render('parts&services',{profileName:profileName,parts:results1,services:results2})
			})
		})
	}
	else res.render('index')
})

app.get('/fix_appointment',(req,res)=>{
	if(req.session.loggedin){
		res.render('fix_appointment',{profileName: req.session.name,results:""});
	}
	else{
		res.render('index');
	}
})

app.post('/fix_appointment_post',(req,res)=>{
	console.log("post hit")
	if(req.session.loggedin){
		const wemail=req.body.workshop
		const uemail=req.session.email
		var formatedMysqlString = (new Date ((new Date((new Date(new Date())).toISOString() )).getTime() - ((new Date()).getTimezoneOffset()*60000))).toISOString().slice(0, 19).replace('T', ' ');
		console.log( formatedMysqlString );
		console.log(req.body);
		connection.query('insert into appointments set ?',{workshop_email:wemail,user_email:uemail,appointment_time:formatedMysqlString},(err,results)=>{
			if(err) throw err
			connection.query('select * from appointments where `user_email`=?',[req.session.email],(err,results)=>{
				if(err) throw err
				res.render('uProfile', { profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results, prob:"" });
			})
		})
	}
	else{
		res.render('uProfile',{ profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results, prob:"appointment_not_fixed",results:""});
	}
})
app.get('/add_parts', (req, res) => {
	if (req.session.loggedin) {
		connection.query('SELECT * FROM parts_list', (err,results)=>{
			if(err) throw err
			let profile = req.session.name
			res.render('practice-add_parts',{ profileName: profile, parts: results,prob:""})
		})
	}
	else res.render('index')
})
app.get('/nearestRoute',(req,res)=>{
	var lat1,lon1
	const email=req.session.email
	if(req.session.loggedin){
		connection.query('Select lati,longi from users where `email`=?',[email],(err,results)=>{
			if(err) throw err
			lat1=results[0].lati
			lon1=results[0].longi
			connection.query('Select name,email,lati,longi from workshops',(err,results)=>{
				if(err) throw err
				console.log(results.length)
				let workshops=[]
				let distances=[]
				for(let i=0;i<results.length;i++){
				let lat2 = results[i].lati
				let lon2 = results[i].longi
				var R = 6371; // Radius of the earth in km
				var dLat = (lat2-lat1)*(Math.PI/180);  // deg2rad below
				var dLon = (lon2-lon1)*(Math.PI/180); 
				var a = 
					Math.sin(dLat/2) * Math.sin(dLat/2) +
					Math.cos((lat1)*(Math.PI/180)) * Math.cos((lat2)*(Math.PI/180)) * 
					Math.sin(dLon/2) * Math.sin(dLon/2)
					; 
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
				var d = R * c; // Distance in km
				var name=results[i].name
				var email=results[i].email
				var obj={d,name,email,lat2,lon2}
				distances.unshift(obj);
			}
			distances.sort((a,b)=>{
				return a.d-b.d
			})
			console.log(distances)
			res.render('mappo',{profileName: req.session.name,result:distances[0]});
			})
		})
		
	}
	else res.render('index')
})
app.get('/test',(req,res)=>{
	res.render('test');
})
app.get('/loc',(req,res)=>{
	if(req.session.loggedin){
	var position
	res.render('combined',{title: 'Express',session: req.session,position:position});
	}
	else{
		res.render('index');
	}
})
app.get('/myLoc',(req,res)=>{
	if(req.session.loggedin){
	var position
	res.render('maps',{title: 'Express',session: req.session,position:position});
	}
	else{
		res.render('index');
	}
})
app.post('/postMyLoc', async (req,res)=>{
	console.log("HIT")
	//console.log(req.body);
	var lat=req.body.lat
	var long=req.body.long
	//lat=parseFloat(lat)
	//long=parseFloat(long)
	console.log(lat)
	console.log(long)
	var email=req.session.email
	console.log(email)
	var flag="L"
	connection.query('Update users set `lati`=?,`longi`=? where `email`=?',[lat,long,email],(error,results)=>{
		if(error) {
			flag="LX"
			throw error	
		}
		else{
			flag="L"
		}
		console.log("hello");
		console.log(results);
		connection.query('select * from appointments where `user_email`=?',[req.session.email],(err,results)=>{
			if(err) throw err
			res.render('uProfile', { profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results, prob:"" });
		})
	})
})
app.post('/postLoc', async (req,res)=>{
	console.log("HIT")
	//console.log(req.body);
	var lat=req.body.lat
	var long=req.body.long
	//lat=parseFloat(lat)
	//long=parseFloat(long)
	console.log(lat)
	console.log(long)
	var email=req.session.email
	var flag="L"
	connection.query('Update workshops set `lati`=?,`longi`=? where `email`=?',[lat,long,email],(error,results)=>{
		if(error) {
			flag="LX"
			throw error	
		}
		else{
			flag="L"
		}
		console.log("hello");
		console.log(results);
		connection.query('select * from appointments where completion_time IS NULL',(err,results)=>{
			if(err) throw err
			res.render('wProfile',{  profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results,num:services_num,prob:"" })
		})
	})
})
app.post('/add_parts_post', async (req,res)=>{
	var {ID,manufacturer,price,quantity,details}=req.body
	const email=req.session.email
	var present=0
	var part_name
	 connection.query('Select * from parts where `parts_id`=? AND `workshop_email`=?',[ID,email],(error,results,fields)=>{
		if(error) throw error
		if(results.length > 0){
			res.render('practice-add_parts',{profileName:"",prob :"F" })
		}
		else{
			connection.query('Select name from parts_list where ID=?',[ID],(error,results,fields)=>{
				if(error) throw error
				else if(results.length > 0){
					part_name=results[0].name
					console.log(results[0].name)
					console.log("name got")
					connection.query('Insert into parts set ?',{parts_id:ID, workshop_email:email,manufacturer:manufacturer,p_name:part_name,price:price,quantity:quantity,details:details},(err,results,fields)=>{
						if(err){
							return connection.rollback(function() {
								throw err;
							});
						}
						connection.query('select * from appointments where completion_time IS NULL',(err,results)=>{
							if(err) throw err
							res.render('wProfile',{  profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results,num:services_num,prob:"" })
						})
					})

				}
			})
		}
	})
	
})
app.get('/nearWorkshops',(req,res)=>{
	var lat1,lon1
	const email=req.session.email
	if(req.session.loggedin){
		connection.query('Select lati,longi from users where `email`=?',[email],(err,results)=>{
			if(err) throw err
			lat1=results[0].lati
			lon1=results[0].longi
			connection.query('Select name,email,lati,longi from workshops',(err,results)=>{
				if(err) throw err
				console.log(results.length)
				let workshops=[]
				let distances=[]
				for(let i=0;i<results.length;i++){
				let lat2 = results[i].lati
				let lon2 = results[i].longi
				var R = 6371; // Radius of the earth in km
				var dLat = (lat2-lat1)*(Math.PI/180);  // deg2rad below
				var dLon = (lon2-lon1)*(Math.PI/180); 
				var a = 
					Math.sin(dLat/2) * Math.sin(dLat/2) +
					Math.cos((lat1)*(Math.PI/180)) * Math.cos((lat2)*(Math.PI/180)) * 
					Math.sin(dLon/2) * Math.sin(dLon/2)
					; 
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
				var d = R * c; // Distance in km
				var name=results[i].name
				var email=results[i].email
				var obj={d,name,email}
				distances.unshift(obj);
			}
			distances.sort((a,b)=>{
				return a.d-b.d
			})
			console.log(distances)
			res.render('fix_appointment',{profileName: req.session.name,results:distances});
			})
		})
		
	}
	else res.render('index')
})
app.get('/add_services', (req, res) => {
	if (req.session.loggedin) {
		connection.query('SELECT * FROM services_list', (err,results)=>{
			if(err) throw err
			let profile = req.session.name
			res.render('practice-add_services',{ profileName: profile, services: results,prob:""})
		})
	}
	else res.render('index')
})
app.post('/add_services_post', async (req,res)=>{
	var {ID,price,details}=req.body
	const email=req.session.email
	var service_name
	 connection.query('Select * from services where `service_id`=? AND `workshop_email`=?',[ID,email],(error,results,fields)=>{
		if(error) throw error
		if(results.length > 0){
			res.render('practice-add_services',{profileName:req.session.name,services:"",prob :"FF" })
		}
		else{
			connection.query('Select name from services_list where ID=?',[ID],(error,results,fields)=>{
				if(error) throw error
				else if(results.length > 0){
					service_name=results[0].name
					console.log(results[0].name)
					console.log("name got")
					const available=1
					connection.query('Insert into services set ?',{service_id:ID, workshop_email:email,s_name:service_name,price:price,details:details,availability:available},(err,results,fields)=>{
						if(err){
							return connection.rollback(function() {
								throw err;
							});
						}
					})
					connection.query('select * from appointments where completion_time IS NULL',(err,results)=>{
						if(err) throw err
						res.render('wProfile',{  profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results,num:services_num,prob:"" })
					})
				}
			})
		}
	})
	
})
app.get('/search_parts', (req, res) => {
	if (req.session.loggedin) {
		let profile=req.session.name
		res.render('search_parts',{ part_name:"",profileName: profile, parts:"",prob:""})
	}
	else res.render('index')
})
app.post('/search_parts_post', async (req,res)=>{
	console.log("post hit")
	var {part_name}=req.body
	console.log(req.body)
	const email=req.session.email
	 connection.query('Select workshops.name, parts.workshop_email,parts.manufacturer,parts.p_name,parts.price,parts.quantity,parts.details from parts inner join workshops on workshops.email=parts.workshop_email where parts.p_name=?',[part_name],(error,results,fields)=>{
		
		if(error) throw error
		if(results.length === 0){
			res.render('search_parts',{part_name:part_name,parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"F" })
		}
		else{
			console.log(results)
			res.render('search_parts',{part_name:part_name,parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"S" })
		}
	})
	
})
app.get('/search_services', (req, res) => {
	if (req.session.loggedin) {
		let profile=req.session.name
		res.render('search_services',{ service_name:"",profileName: profile, services:"",prob:""})
	}
	else res.render('index')
})
app.post('/search_services_post', async (req,res)=>{
	console.log("post hit")
	var {service_name}=req.body
	console.log(req.body)
	const email=req.session.email
	 connection.query('Select workshops.name, services.workshop_email,services.price,services.details,services.availability from services inner join workshops on workshops.email=services.workshop_email where services.s_name=?',[service_name],(error,results,fields)=>{
		if(error) throw error
		if(results.length === 0){
			res.render('search_services',{ service_name: service_name,services:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"F" })
		}
		else{
			console.log(results)
			res.render('search_services',{service_name: service_name,services:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"S" })
		}
	})
	
})
app.get('/create_appointment', async (req, res) => {
	if (req.session.loggedin){
		var {service_name}=req.body
		console.log(req.body)
		const email=req.session.email
		 connection.query('Select * from services',(error,results,fields)=>{
			if(error) throw error
			if(results.length === 0){
				res.render('create_appointment',{ service_name: service_name,services:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"F" })
			}
			else{
				console.log(results)
				res.render('create_appointment',{service_name: service_name,services:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"S" })
			}
		})
	}
	else res.render('login',{prob:""})
})
app.post('/create_appointment_post', async (req,res)=>{
	console.log("post hit")
	var {service_name}=req.body
	console.log(req.body)
	const email=req.session.email
	 connection.query('Select * from services where name=?',[service_name],(error,results,fields)=>{
		if(error) throw error
		if(results.length === 0){
			res.render('search_services',{ service_name: service_name,services:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"F" })
		}
		else{
			console.log(results)
			res.render('search_services',{service_name: service_name,services:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"S" })
		}
	})
	
})
app.post('/complete_appointment', async (req,res)=>{
	console.log("post hit")
	const appointment_id=req.body.appointment_id
	const email=req.session.email
	var sqlDatetime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toJSON().slice(0, 19).replace('T', ' ');
	 connection.query('Update appointments set `completion_time`=? where `ID`=?',[sqlDatetime,appointment_id],(error,results,fields)=>{
		if(error) throw error
		connection.query('select * from appointments where completion_time IS NULL',(err,results)=>{
			if(err) throw err
			res.render('wProfile',{  profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results,num:4,prob:"appointment_finish" })
		})
	})
	
})
app.get('/edit_parts', (req, res) => {
	if (req.session.loggedin) {
		let profile=req.session.name
		res.render('edit_parts',{ part_name:"",profileName: profile, parts:"",prob:""})
	}
	else res.render('index')
})
app.post('/edit_parts_post', async (req,res)=>{
	console.log("post hit")
	var {manufacturer,name,price,quantity,details}=req.body
	console.log(req.body)
	const email=req.session.email
	 connection.query('Select * from parts where p_name=? AND workshop_email=?',[name,email],(error,results,fields)=>{
		if(error) throw error
		if(results.length === 0){
			res.render('/edit_parts',{part_name:part_name,parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"F" })
		}
		else{
			console.log(results)
			connection.query('UPDATE parts set manufacturer=?, price=?,quantity=?,details=? where p_name=? AND workshop_email=?',[manufacturer,price,quantity,details,name,email], (error,results,fields)=>{
				if(error) throw error
				if(results.length===0){
					res.render('edit_parts',{parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"FF" })
				}
				else{
					res.render('edit_parts',{parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"S" })
				}
			})
		}
	})
	
})

app.get('/delete_parts', (req, res) => {
	if (req.session.loggedin) {
		let profile=req.session.name
		res.render('delete_parts',{ part_name:"",profileName: profile, parts:"",prob:""})
	}
	else res.render('index')
})
app.post('/delete_parts_post', async (req,res)=>{
	console.log("post hit")
	var {name}=req.body
	console.log(req.body)
	const email=req.session.email
	 connection.query('Select * from parts where p_name=? AND workshop_email=?',[name,email],(error,results,fields)=>{
		if(error) throw error
		if(results.length === 0){
			res.render('/delete_parts',{part_name:part_name,parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"F" })
		}
		else{
			console.log(results)
			connection.query('DELETE FROM parts where p_name=? AND workshop_email=?',[name,email], (error,results,fields)=>{
				if(error) throw error
				if(results.length===0){
					res.render('delete_parts',{parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"FF" })
				}
				else{
					res.render('delete_parts',{parts:results ,profileName: req.session.name, email: req.session.email,mobile:req.session.mobile ,prob :"S" })
				}
			})
		}
	})
	
})


app.get('/uProfile', (req, res) => {
	if (req.session.loggedin) {
		connection.query('select * from appointments where `user_email`=?',[req.session.email],(err,results)=>{
			if(err) throw err
			console.log(results)
			res.render('uProfile', { profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results, prob:"" });
		})
		
	}
	else res.render('login',{prob:""})
})
app.get('/wProfile', (req, res) => {
	if (req.session.loggedin) {
		const email = req.session.email
		connection.query('select COUNT(service_id) from services where workshop_email=?',[email],(error,results,fields)=>{
			if(error) throw error
			console.log(results)
			let services_num=Object.values(results[0])[0]
			console.log(services_num)
			connection.query('select * from appointments where completion_time IS NULL',(err,results)=>{
				if(err) throw err
				console.log(results)
				res.render('wProfile',{  profileName: req.session.name, email: req.session.email,mobile:req.session.mobile,appointments:results,num:services_num,prob:"" })
			})
		})

	}
	else res.render('login',{prob:""})
})
app.get('/contact_us',(req,res)=>{
	res.render('about-us');
})
app.get('/', (req, res) => {
	res.render('index',{prob:""})
})

app.get('/login', (req, res) => {
	res.render('login', { prob: "" })
})

app.get('/register', (req, res) => {
	res.render('register', { prob: "" })
})

app.get('/registerW', (req, res) => {
	res.render('registerW', { prob: "" })
})

app.get('/logout', (req, res) => {
	req.session.destroy(function (err) {
		res.redirect('/'); //Inside a callback… bulletproof!
	});
})


app.post('/auth', async function (request, response) {

	// Capture the input fields
	const { email, password, selectBox } = request.body;

	// Ensure the input fields exists and are not empty
	if (email && password) {

		// Execute SQL query that'll select the account from the database based on the specified username and password
		if (selectBox === 'car_owner') {

			connection.query('SELECT * FROM users WHERE email = ?', [email], async function (error, results, fields) {
				// If there is an issue with the query, output the error
				if (error) throw error;

				// If the account exists
				if (results.length > 0 && await bcrypt.compare(password, results[0].password)) {

					// Authenticate the user
					request.session.loggedin = true;
					request.session.name = results[0].name;
					request.session.email = email;
					request.session.address = results[0].address;
					request.session.mobile = results[0].mobile
					response.redirect('/uProfile')
				} else {

					response.render('login', { prob: "incorrect" })
				}
				response.end();
			});
		}
		else {
			connection.query('SELECT * FROM workshops WHERE email = ?', [email], async function (error, results, fields) {
				// If there is an issue with the query, output the error
				if (error) throw error;
				// If the account exists
				if (results.length > 0 && await bcrypt.compare(password, results[0].password)) {

					// Authenticate the user
					request.session.loggedin = true;
					request.session.name = results[0].name;
					request.session.email = email;
					request.session.address = results[0].address;
					request.session.mobile = results[0].mobile
					response.redirect('/wProfile')
				} else {

					response.render('login', { prob: "incorrect" })
				}
				response.end();
			});

		}
	} else {
		response.render('login', { prob: "details" })
		response.end();
	}
});

app.post('/reg', async (req, res) => {
	console.log(req.body);
	const { name, email, password, passwordConfirm, mobile, address } = req.body;
	if (name && email && password && passwordConfirm) {
		connection.query('SELECT email from users WHERE email = ?', [email], async (err, results) => {
			if (err) {
				console.log(err);
			}
			else {
				if (results.length > 0) {
					// res.send('Email already registered!')
					res.render('register', { prob: "email" })
					res.end();
				} else if (password != passwordConfirm) {
					// res.send('Passwords do not match!')
					res.render('register', { prob: "pass" })
					res.end();
				}
				else {
					let hashedPassword = await bcrypt.hash(password, 8);
					console.log(hashedPassword);

					connection.query('INSERT INTO users SET ?', { name: name, email: email, password: hashedPassword, mobile: mobile, address: address }, (err, results) => {
						if (err) {
							console.log(err);
						} else {
							// res.send('User registered');
							res.render('login', { prob: "success" })
							res.end();
						}
					})
				}
			}
		}
		)
	}
	else {
		res.render('register', { prob: "details" })
	}
})

app.post('/regW', async (req, res) => {
	console.log(req.body);
	const { name, email, password, passwordConfirm, mobile, district, area, address_details } = req.body;
	if (name && email && password && passwordConfirm && mobile && district && area && address_details) {
		connection.query('SELECT email from workshops WHERE email = ?', [email], async (err, results) => {
			if (err) {
				console.log(err);
			}
			else {
				if (results.length > 0) {
					// res.send('Email already registered!')
					res.render('register', { prob: "email" })
					res.end();
				} else if (password != passwordConfirm) {
					// res.send('Passwords do not match!')
					res.render('register', { prob: "pass" })
					res.end();
				}
				else {
					let hashedPassword = await bcrypt.hash(password, 8);
					console.log(hashedPassword);

					connection.query('INSERT INTO workshops SET ?', { name: name, email: email, mobile: mobile, password: hashedPassword, district: district, area: area, address_details: address_details }, (err, results) => {
						if (err) {
							console.log(err);
						} else {
							// res.send('Workshop registered');
							res.render('login', { prob: "success" })
							res.end();
						}
					})
				}
			}
		}
		)
	}
	else {
		res.render('register', { prob: "details" })
	}
})



app.listen(4000, () => {
	console.log('Server running on port 4000');
})
