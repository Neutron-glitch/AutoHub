var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var database = require('../database');
let alert = require('alert');
// const { query } = require('../database');


/* GET home page. */
router.get('/', function (req, res, next) {
    console.log('router has been hit');
    res.render('pages/index.ejs', { title: 'Express', session: req.session });
});

router.post('/login', function (request, response, next) {

    var user_email_address = request.body.user_email_address;

    var user_password = request.body.user_password;

    if (user_email_address && user_password) {
        query = `
        SELECT * FROM user_login 
        WHERE user_email = "${user_email_address}"
        `;

        database.query(query, async function (error, data) {

            if (data.length > 0) {
                for (var count = 0; count < data.length; count++) {
                    if (await bcrypt.compare(user_password, data[0].user_password)) {
                        request.session.user_id = data[count].user_id;

                        response.redirect("/");
                    }
                    else {
                        response.send('Incorrect Password');
                    }
                }
            }
            else {
                response.send('Incorrect Email Address');
            }
            response.end();
        });
    }
    else {
        response.send('Please Enter Email Address and Password Details');
        response.end();
    }

});

router.get('/logout', function (request, response, next) {

    request.session.destroy();

    response.redirect("/");

});

router.get('/register', (req, res) => {
    console.log('register hit');
    res.render('pages/Register_As_Car_Owner.ejs', { title: 'Express', session: req.session });
})

router.get('/maps', (req, res) => {
    console.log('register hit');
    res.render('pages/maps.ejs', { title: 'Express', session: req.session });
})

router.get('/mappo', (req, res) => {
    console.log('register hit');
    res.render('pages/mappo.ejs', { title: 'Express', session: req.session });
})

router.post('/register_user', async (req, res) => {
    console.log(req.body);
    // var user_email_address = req.body.user_email_address;
    const {name, email, password, confpassword, address} = req.body;

    console.log(name, email, password, confpassword, address);

    //var user_password = req.body.user_password;

    //var user_confirm_password = req.body.user_confirm_password;

    if (email && password) {
        query = `
        SELECT * FROM user_login 
        WHERE user_email = "${email}"
        `;

        database.query(query, async (err, results) => {
            if (err) {
                console.log(err);
            }
            else {
                if (results.length > 0) {
                    res.send('Email already registered!')
                    //res.render('register', { prob : "email" })
                    res.end();
                } else if (confpassword != password) {
                    res.send('Passwords do not match!')
                    //res.render('register', { prob : "pass" })
                    res.end();
                }
                else {
                    let hashedPassword = await bcrypt.hash(password, 8);
                    console.log(hashedPassword);
                    database.query('INSERT INTO user_login SET ?', { user_email: email, user_password: hashedPassword }, (err, results) => {
                        if (err) {
                            console.log(err);
                        } else {
                           // res.send('User registered');
                            alert("user registered");
                            res.render('pages/index.ejs', {prob:"success"})
                            res.end();
                        }
                    })
                }
            }
        }
        )
    }
    else {
        res.send('Incomplete Registration');
    }
})




module.exports = router;