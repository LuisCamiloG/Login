// 1 - Invocamos a Express
const express = require('express');
const app = express();

// 2 - Seteamos urlencoded para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

// 3 - Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'})

// 4 - Seteamos directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

// 5 - Establecemos el motor de plantillas ejs
app.set('view engine', 'ejs');

// 6 - Invocamos a bcryptsjs
const bcryptsjs = require('bcryptjs');

// 7 - Configuramos las variables de sesión
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// 8 - Invomcamos modulo de conexión de la BD
const connection = require('./database/db');

// - 9 Estableciendo rutas
    app.get('/login', (req, res)=>{
        res.render('login');
    })

    app.get('/register', (req, res)=>{
        res.render('register');
    })


// 10 - Registración
app.post('/register', async (req,res)=>{
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    let passwordHaash = await bcryptsjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?', {user:user, name:name, rol:rol, pass:passwordHaash}, async(error, results)=>{
        if(error){
            console.log(error);
        }else{
            res.render('register', {
                alert: true,
                alertTitle: "Registration",
                alertMessage: "Successfull Registration!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer:1500,
                ruta:''
            })
        }
    })
})

// 11 - Autenticación
app.post('/auth', async (req,res)=>{
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptsjs.hash(pass, 8);
    if(user && pass){
        connection.query('SELECT * FROM users WHERE user = ?', [user], async(error, results)=>{
            if (results.length == 0 || !(await bcryptsjs.compare(pass, results[0].pass))) {
                res.render('login',{
                    alert:true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o password incorrectas",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer:false,
                    ruta:'login'
                });
            }else{
                req.session.loggedin = true;
                req.session.name= results[0].name
                res.render('login',{
                    alert:true,
                    alertTitle: "Conexión exitosa",
                    alertMessage: "¡LOGIN CORRECTO!",
                    alertIcon: "Success",
                    showConfirmButton: false,
                    timer:1500,
                    ruta:''
                });
            }
        })
    }else{
        res.render('login',{
                    alert:true,
                    alertTitle: "Advertencia",
                    alertMessage: "¡Por favor ingrese un usuario y/o password!",
                    alertIcon: "Warning",
                    showConfirmButton: true,
                    timer:false,
                    ruta:'login'
    });
    }
})

// 12 - Auth pages
app.get('/', (req, res)=>{
    if(req.session.loggedin) {
        res.render('index',{
            login: true,
            name: req.session.name
        });
    }else{
        res.render('index',{
            login:false,
            name:'Debe iniciar sesión'
        })
    }
})

// 13 - Logout
app.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

app.listen(3000, (req, res) => {
    console.log('SERVER RUNNING IN http://localhost:3000');
});