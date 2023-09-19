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
  name: 'myCookie',
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

const cart = []; 
app.use((req, res, next) => {
  res.locals.cartSize = cart.length; // Almacena el tamaño del carrito en res.locals
  next();
});

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
app.post('/payment', (req, res) => {
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
    res.redirect('/login')
  }
});

// Ruta para procesar el pago
app.post('/checkout', (req, res) => {
  const selectedPaymentMethod = req.body.paymentMethod; 
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
    const itemsPerPage = 8; // Número de autos por página
    const page = req.query.page || 1; // Obtiene el número de página de la consulta, predeterminado a 1 si no se especifica.
  
    // Calcula el índice de inicio y fin para los autos en la página actual.
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
  
    const query = 'SELECT * FROM autodisponible0km LIMIT ?, ?';
  
    connection.query(query, [startIndex, itemsPerPage], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al obtener los autos');
      }
  
      // Consulta adicional para contar el número total de autos.
      connection.query('SELECT COUNT(*) AS totalCount FROM autodisponible0km', (countErr, countResult) => {
        if (countErr) {
          console.error(countErr);
          return res.status(500).send('Error al obtener el conteo de autos');
        }
  
        const autos = results;
        const totalCount = countResult[0].totalCount;
        const totalPages = Math.ceil(totalCount / itemsPerPage);
  
        res.render('autos', { autos: autos, totalPages: totalPages, currentPage: page });
      });
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

// Ruta  inicio de sesión
app.get('/login', (req, res) => {
 
     res.render('login' ); 
});

// Ruta creacion de cuenta
app.get('/createAccount', (req, res) => {
  
  res.render('createAccount'); 


});

// requiere autenticacion
app.get('/perfil', (req, res) => {
  if (req.session.usuario) {
   res.render('profile');
   
  } else {
    res.redirect('/login'); 
  }
});

// logica inicio sesion
app.post('/loginlog', (req, res) => {
  const nick = req.body.nick;
  const contrasenia = req.body.contrasenia;
  var  message = 'Error de datos'
  connection.query(
    'SELECT * FROM usuario WHERE nick = ? AND contrasenia = ?',
    [nick, contrasenia],
    (err, results) => {
      if (err) {
       
        console.error('Error al consultar la base de datos:', err);
        res.redirect('/login' );
      } else if (results.length === 1) {
        // Inicio de sesión exitoso
        const usuario = results[0];

        // Almacena el nombre del usuario en la sesión
        req.session.usuario = usuario.nick;

        res.redirect('/'); 
      } else {
       
        res.render('login',{ message });
      }
    }
  );
});

// Ruta para cerrar la sesión
app.get('/logout', (req, res) => {
  // Eliminar la información de la sesión del servidor
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar la sesión:', err);
    }

    res.clearCookie('myCookie'); 
    res.redirect('/login');
  });
});
 

// Ruta creacion de cuenta
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