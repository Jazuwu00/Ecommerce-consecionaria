const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const app = express();
const path = require('path'); // Importa el módulo 'path'
const mysql = require('mysql2');
const session= require('express-session');
const nodemailer = require('nodemailer');

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

//conexion sql
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

const cart = []; 

app.use((req, res, next) => {
  res.locals.cartSize = cart.length; 
  next();
});

// Ruta para mostrar el contenido del carrito
app.get('/cart', (req, res) => {
    console.log(cart)
      res.render('cart', { cart });
});
  
    
// ruta principal
app.get('/', (req, res) => {
      const query = 'SELECT * FROM autodisponible0km ';
    
      connection.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al obtener los autos');
        }
    
      res.render('index', { autos: results } );
      })
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
app.get('/removeFromCart', (req, res) => {
  
  const productId = req.query.productId;
  
  const productIndex = cart.findIndex((item) => item.id === productId);

  if (productIndex !== -1) {
    console.log('eliminando')
    cart.splice(productIndex, 1); // Eliminar el producto del carrito
    console.log(cart)
  }

  res.redirect(`/cart`);
});

//Configuracion Mail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'jazsaraviav@gmail.com',
    pass: 'ztty pfku pmyb oxqj',
  },
});

const sendMailAsync = util.promisify(transporter.sendMail).bind(transporter);

app.get('/sendMail', async (req, res) => {
  try {
    // Genera la tabla HTML con los datos del carrito
    const cartTable = `
      <table style="text-align:center;  color: black; border-collapse: collapse; width: 70%;">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          ${cart.map(item => `
            <tr>
              <td>${item.type === 'auto' ? `${item.marca} ${item.modelo}` : item.nombre}</td>
              <td>${item.quantity }</td>
              <td>$${item.precio !== undefined ? item.precio : 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Calcula el total

    const total = cart.reduce((acc, item) => acc +( item.quantity * (item.precio !== undefined ? item.precio : 0)), 0);

    const mailOptions = {
      from: 'jazsaraviav@gmail.com',
      to: 'jsaraviaa98@gmail.com',
      subject: '<h4 style=" color: black;  ">Datos de tu compra </h4>',
      html: `
        <div style=" color: black; padding: 30px; ">
          <p>Detalles de tu Compra:</p>
          ${cartTable}
          <p>Total: $${total}</p>
        </div>
      `,
    };

    await sendMailAsync(mailOptions);

    console.log('Correo electrónico enviado con éxito');
    res.render('thankyou');
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
    res.status(500).send('Error al enviar el correo electrónico');
  }
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

  // Ruta para mostrar los autos desde la base de datos
  app.get('/autos', (req, res) => {
    const itemsPerPage = 8;
    const page = req.query.page || 1; 
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const query = 'SELECT * FROM autodisponible0km LIMIT ?, ?';
    connection.query(query, [startIndex, itemsPerPage], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al obtener los autos');
      }
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
  
  // Ruta para reparaciones
  app.get('/reparacion', (req, res) => {
    const itemsPerPage = 8;
    const page = req.query.page || 1; 
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const query = 'SELECT * FROM reparaciondisponible LIMIT ?, ?';
    connection.query(query, [startIndex, itemsPerPage], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al obtener los autos');
      } 
      connection.query('SELECT COUNT(*) AS totalCount FROM reparaciondisponible', (countErr, countResult) => {
        if (countErr) {
          console.error(countErr);
          return res.status(500).send('Error al obtener el conteo de autos');
        }
  
        const reparaciones = results;
        const totalCount = countResult[0].totalCount;
        const totalPages = Math.ceil(totalCount / itemsPerPage);
  
        res.render('reparacion', { reparaciones: reparaciones, totalPages: totalPages, currentPage: page });
      });
    });
  });
  
 // Ruta para autos usados
 app.get('/usados', (req, res) => {
  const itemsPerPage = 8;
  const page = req.query.page || 1; 
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const query = 'SELECT * FROM autousado LIMIT ?, ?';
  connection.query(query, [startIndex, itemsPerPage], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener los autos');
    } 
    connection.query('SELECT COUNT(*) AS totalCount FROM autousado ', (countErr, countResult) => {
      if (countErr) {
        console.error(countErr);
        return res.status(500).send('Error al obtener el conteo de autos');
      }

      const autos = results;
      const totalCount = countResult[0].totalCount;
      const totalPages = Math.ceil(totalCount / itemsPerPage);

      res.render('usados', { autos: autos, totalPages: totalPages, currentPage: page });
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
  var  message = 'Contraseña o usuario incorrecto'
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