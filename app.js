const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path'); // Importa el módulo 'path'
const mysql = require('mysql2');
const session= require('express-session');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'concesionarialpp', 
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// express-session
app.use(session({
  secret: 'secreto', 
  resave: false,
  saveUninitialized: true,
}));

// session disponible para todas las rutas
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});


app.set('view engine', 'ejs');


app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const cart = []; // Arreglo para productos en el carrito


  
  // Rutas
  
  // Ruta para agregar productos al carrito
  app.get('/addToCart/:id', (req, res) => {
    const idProducto = req.params.id;
  
    connection.query(
      'SELECT * FROM autodisponible0km WHERE codAD0KM = ?',
      [idProducto],
      (error, autoResults) => {
        if (error) {
          res.status(500).send('Error al obtener el auto');
        } else if (autoResults.length > 0) {
          // Producto es un auto
          const existingAuto = cart.find(item => item.id === idProducto);
  
          if (existingAuto) {
            existingAuto.quantity += 1;
          } else {
            cart.push({ id: idProducto, type: 'auto', quantity: 1, ...autoResults[0] });
          }
  
          res.redirect('/cart');
        } else {
          connection.query(
            'SELECT * FROM accesorio WHERE codACC = ?',
            [idProducto],
            (error, accesorioResults) => {
              if (error) {
                res.status(500).send('Error al obtener el accesorio');
              } else if (accesorioResults.length > 0) {
                // Producto es un accesorio
                
                const existingAccesorio = cart.find(item => item.id === idProducto);
  
                if (existingAccesorio) {
                  existingAccesorio.quantity += 1;
                } else {
                  cart.push({ id: idProducto, type: 'accesorio', quantity: 1, ...accesorioResults[0] });
                }
  
                res.redirect('/cart');
              } else {
                res.send('No se encontró el producto');
              }
            }
          );
        }
      }
    );

   
  });
  
// Ruta para eliminar productos del carrito
app.post('/removeFromCart', (req, res) => {
  const productId = req.body.productId;

  // Buscar el producto en el carrito
  const productIndex = cart.findIndex((item) => item.id === productId);

  if (productIndex !== -1) {
    cart.splice(productIndex, 1); // Eliminar el producto del carrito
  }

  res.redirect(`/cart`);
});


// Ruta para mostrar la página de métodos de pago
app.get('/payment', (req, res) => {
  if (req.session.usuario) {
    // Si el usuario tiene una sesión activa, procede a mostrar la página de métodos de pago
    const query = 'SELECT * FROM formapago';
    connection.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return;
      }
      res.render('paymentMethods', { metodo: results });
    });
  } else {
    // Si el usuario no tiene una sesión activa, redirige a la página de inicio de sesión
    res.redirect('/login');
  }
});

// Ruta para procesar el pago
app.post('/checkout', (req, res) => {
  const selectedPaymentMethod = req.body.paymentMethod; 
  // Obtener el método de pago seleccionado desde el formulario

  
  // Luego redirige a la página de confirmación o agradecimiento
  res.redirect('/thankyou');
});

// Ruta para mostrar el mensaje después de completar la compra
app.get('/thankyou', (req, res) => {
  res.render('thankyou');
});

  // Ruta para mostrar el contenido del carrito
  app.get('/cart', (req, res) => {
    res.render('cart', { cart });
  });

  
// ruta principal
  app.get('/', (req, res) => {
    res.render('index');
  });


  // Ruta para mostrar los autos desde la base de datos
app.get('/autos', (req, res) => {
  const query = 'SELECT * FROM autodisponible0km';
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error( err);
    
      return;
    }
    
    
    res.render('autos', { autos: results });
  });
});

// Ruta para mostrar los productos desde la base de datos
app.get('/products', (req, res) => {
  const query = 'SELECT * FROM accesorio';
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error(err);
      
      return;
    }
    
   
    res.render('products', { products: results });
  });
});
  



  // Ruta para visualizar un producto específico
app.get('/autos/:id', (req, res) => {
  const idProducto = req.params.id;

  connection.query(
    'SELECT * FROM autodisponible0km WHERE codAD0KM = ?',
    [idProducto],
    (error, results) => {
      if (error) {
        res.status(500).send('Error al obtener el auto');
      } else if (results.length > 0) {
        const autoToShow = results[0];
        res.render('auto', { auto: autoToShow });
      } else {
        res.send('No se encontró el auto con el ID ' + idProducto);
      }
    }
  );
});

app.get('/product/:id', (req, res) => {
  const idProducto = req.params.id;

  connection.query(
    'SELECT * FROM accesorio WHERE codACC = ?',
    [idProducto],
    (error, results) => {
      if (error) {
        res.status(500).send('Error al obtener el accesorio');
      } else if (results.length > 0) {
        const productToShow = results[0];
        res.render('product', { product: productToShow });
      } else {
        res.send('No se encontró el accesorio con el ID ' + idProducto);
      }
    }
  );
});


// Ruta para manejar el inicio de sesión
app.get('/login', (req, res) => {
  
      res.render('login'); 
    
  
});

// Ruta para manejar la creacion de cuenta
app.get('/createAccount', (req, res) => {
  
  res.render('createAccount'); 


});

// En una ruta protegida que requiere autenticación
app.get('/perfil', (req, res) => {
  if (req.session.usuario) {
    // El usuario tiene una sesión activa, muestra la página de perfil
    // Accede a req.session.usuario para obtener la información del usuario
  } else {
    res.redirect('/login'); // Redirige al inicio de sesión si no hay sesión activa
  }
});


app.post('/loginlog', (req, res) => {
  const nick = req.body.nick;
  const contrasenia = req.body.contrasenia;

  connection.query(
    'SELECT * FROM usuario WHERE nick = ? AND contrasenia = ?',
    [nick, contrasenia],
    (err, results) => {
      if (err) {
        console.error('Error al consultar la base de datos:', err);
        res.redirect('/login');
      } else if (results.length === 1) {
        // Inicio de sesión exitoso
        const usuario = results[0];

        // Almacena el nombre del usuario en la sesión
        req.session.usuario = usuario.nick;

        res.redirect('/'); // Redirige a la página de inicio
      } else {
        res.redirect('/login');
      }
    }
  );
});



// Ruta para manejar el inicio de sesión
app.post('/createAccount', (req, res) => {
  const nick = req.body.nick;
  const contrasenia = req.body.contrasenia;
  const nombre = req.body.nombre;

  // Verificar las credenciales en la base de datos
  connection.query(
    'INSERT INTO usuario (ABM, compras, contrasenia, nick) VALUES (?, ?, ?, ?)',
    [null, null, contrasenia, nick],
    (error, results) => {
      if (error) {
        console.error(error);
       
      }else{
        res.redirect('/login');
      }
    }
  );
});



// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});