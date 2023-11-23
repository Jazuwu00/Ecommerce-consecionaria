const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const app = express();
const path = require('path'); // Importa el módulo 'path'
const mysql = require('mysql2');
const session = require('express-session');
const nodemailer = require('nodemailer');

// express-session
app.use(session({
  name: 'myCookie',
  secret: 'secreto',
  resave: false,
  saveUninitialized: true,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 3600000,
  }
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

    res.render('index', { autos: results });
  })
});
app.get('/user/edit', (req, res) => {
  const userName = res.locals.session.usuario;
  const query = 'SELECT * FROM usuario WHERE nick = ?';
  connection.query(query, [userName], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener datos del usuario');
    }
    res.render('DataUser', { data: results[0] }); // Renderiza la vista de edición y pasa los datos del usuario
  });
});
app.post('/user/update', (req, res) => {
  console.log(req.body);
  const { nick, contrasenia, nombre, apellido, email } = req.body;
  const updateQuery = 'UPDATE usuario SET contrasenia = ?, nombre = ?,apellido=?,email=? WHERE nick = ?';
  connection.query(updateQuery, [contrasenia, nombre, apellido, email, nick], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al actualizar el usuario');
    }
    res.redirect('/');
  });
});
app.get('/addToCart/:id', (req, res) => {
  const idProducto = req.params.id;

  connection.query(
    'SELECT * FROM autodisponible0km WHERE codAD0KM = ?',
    [idProducto],
    (error, autoResults) => {
      if (error) {
        res.status(500).send('Error al obtener el auto');
      } else if (autoResults.length > 0) {
        // Producto es un auto nuevo
        const existingAuto = cart.find(item => item.id === idProducto);

        if (existingAuto) {
          existingAuto.quantity += 1;
        } else {
          cart.push({ id: idProducto, type: 'autonuevo', quantity: 1, ...autoResults[0] });
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
              connection.query(
                'SELECT * FROM reparaciondisponible WHERE codRDISP = ?',
                [idProducto],
                (error, reparacionResults) => {
                  if (error) {
                    res.status(500).send('Error al obtener la reparación');
                  } else if (reparacionResults.length > 0) {
                    // Producto es una reparación
                    const existingReparacion = cart.find(item => item.id === idProducto);

                    if (existingReparacion) {
                      existingReparacion.quantity += 1;
                    } else {
                      cart.push({ id: idProducto, type: 'reparacion', quantity: 1, ...reparacionResults[0] });
                    }

                    res.redirect('/cart');
                  } else {
                    connection.query(
                      'SELECT * FROM autousado WHERE codAU = ?',
                      [idProducto],
                      (error, autousadoResults) => {
                        if (error) {
                          res.status(500).send('Error al obtener el auto usado');
                        } else if (autousadoResults.length > 0) {
                          // Producto es un auto usado
                          const existingAutoUsado = cart.find(item => item.id === idProducto);

                          if (existingAutoUsado) {
                            existingAutoUsado.quantity += 1;
                          } else {
                            cart.push({ id: idProducto, type: 'autousado', quantity: 1, ...autousadoResults[0] });
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
const userName = session.usuario
//Configuracion Mail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'concesionarialpp1@gmail.com',
    pass: 'ydzu lvkf febv gekn',
  },
});

const sendMailAsync = util.promisify(transporter.sendMail).bind(transporter);

app.get('/sendMail', async (req, res) => {

  console.log(userName)
  try {

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
        ${cart.map(item => {
      if (item.type === 'autonuevo') {
        return `
              <tr>
                <td>${item.marca} ${item.modelo}</td>
                <td>${item.quantity}</td>
                <td>$${item.precio !== undefined ? item.precio : 0}</td>
              </tr>
            `;
      } else if (item.type === 'accesorio') {
        return `
              <tr>
                <td>${item.nombre}</td>
                <td>${item.quantity}</td>
                <td>$${item.precio !== undefined ? item.precio : 0}</td>
              </tr>
            `;
      } else if (item.type === 'reparacion') {

        return `
              <tr>
                <td>${item.nombre}</td>
                <td>${item.quantity}</td>
                <td>$${item.precio !== undefined ? item.precio : 0}</td>
               
              </tr>
            `;
      } else if (item.type === 'autousado') {

        return `
              <tr>
              <td>${item.marca} ${item.modelo}</td>
                <td>${item.quantity}</td>
                <td>$${item.precioventa !== undefined ? item.precioventa : 0}</td>
                
              </tr>
            `;
      }
    }).join('')}
        </tbody>
      </table>
    `;


    const total = cart.reduce((acc, item) => acc + (item.quantity * (item.precio !== undefined ? item.precio : 0)), 0);

    const mailOptions = {
      from: 'jazsaraviav@gmail.com',
      to: 'jsaraviaa98@gmail.com',
      subject: 'Datos de tu compra ',
      html: `
        <div style=" color: black; padding: 30px; ">
        <h3> Hola ${userName !== undefined ? userName : ""}, <br> Te enviamos los detalles de tu compra!</h3>

        
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
    (error, autoResults) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error al obtener el auto');
      }

      if (autoResults.length > 0) {
        const autoToShow = autoResults[0];

        connection.query(
          'SELECT * FROM autodisponible0km',
          (error, allAutos) => {
            if (error) {
              console.error(error);
              return res.status(500).send('Error al obtener los autos');
            }

            res.render('auto', { auto: autoToShow, allAutos });
          }
        );
      } else {
        connection.query(
          'SELECT * FROM autousado WHERE codAU = ?',
          [idProducto],
          (error, autoUsadoResults) => {
            if (error) {
              console.error(error);
              return res.status(500).send('Error al obtener el auto usado');
            }

            if (autoUsadoResults.length > 0) {
              const autoToShow = autoUsadoResults[0];

              connection.query(
                'SELECT * FROM autousado',
                (error, allAutosUsados) => {
                  if (error) {
                    console.error(error);
                    return res.status(500).send('Error al obtener los autos usados');
                  }

                  res.render('auto', { auto: autoToShow, allAutos: allAutosUsados });
                }
              );
            } else {
              console.log('No se encontró el auto');

              res.status(404).send('No se encontró el auto');
            }
          }
        );
      }
    }
  );
});


app.get('/product/:type/:id', (req, res) => {
  const tipoProducto = req.params.type;
  const idProducto = req.params.id;

  let tableName;
  let idColumnName;

  switch (tipoProducto) {
    case 'accesorio':
      tableName = 'accesorio';
      idColumnName = 'codACC';
      break;
    case 'autonuevo':
      tableName = 'autodisponible0km';
      idColumnName = 'codAD0KM';
      break;
    case 'autousado':
      tableName = 'autousado';
      idColumnName = 'codAU';
      break;
    case 'reparacion':
      tableName = 'reparaciondisponible';
      idColumnName = 'codRDISP';
      break;
    default:
      return res.status(400).send('Tipo de producto no válido');
  }

  connection.query(
    `SELECT * FROM ${tableName} WHERE ${idColumnName} = ?`,
    [idProducto],
    (error, results) => {
      if (error) {
        res.status(500).send('Error al obtener el producto');
      } else if (results.length > 0) {
        const productToShow = results[0];
        res.render('product', { product: productToShow, type: tipoProducto });
      } else {
        res.send(`No se encontró el producto con el ID ${idProducto}`);
      }
    }
  );
});


// Ruta  inicio de sesión
app.get('/login', (req, res) => {
  const message = req.query.message || '';

  res.render('login', { message });
});

// Ruta creacion de cuenta
app.get('/createAccount', (req, res) => {
  const Wrongmessage = req.query.message || ''; // Cambia "Wrongmessage" a "message"

  res.render('createAccount', { Wrongmessage });
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
  var message = 'Contraseña o usuario incorrecto'
  connection.query(
    'SELECT * FROM usuario WHERE nick = ? AND contrasenia = ?',
    [nick, contrasenia],
    (err, results) => {
      if (err) {

        console.error('Error al consultar la base de datos:', err);
        res.redirect('/login');
      } else if (results.length === 1) {

        const usuario = results[0];

        // Almacena el nombre del usuario en la sesión
        req.session.usuario = usuario.nick;

        res.redirect('/');
      } else {

        res.render('login', { message });
      }
    }
  );
});

// Ruta para cerrar la sesión
app.get('/logout', (req, res) => {

  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar la sesión:', err);
    }

    res.clearCookie('myCookie');
    res.redirect('/login');
  });
});


// Ruta creación de cuenta
app.post('/createAccount', (req, res) => {
  const nick = req.body.nick;
  const contrasenia = req.body.contrasenia;
  const nombre = req.body.nombre;
  const apellido = req.body.apellido;
  const email = req.body.email;

  // Consulta SQL para verificar si el email ya existe
  connection.query(
    'SELECT * FROM usuario WHERE email = ?',
    [email],
    (error, results) => {
      if (error) {
        console.error(error);

      } else {
        if (results.length > 0) {
          console.log('ya existe cuenta con ese correo')
          const Wrongmessage = 'Correo electrónico ya registrado';
          console.log(Wrongmessage)
          res.redirect(`/createAccount?message=${Wrongmessage}`);
        } else {
          console.log('cuenta creada')
          connection.query(
            'INSERT INTO usuario (ABM, compras, nombre, apellido, email, contrasenia, nick) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [null, null, nombre, apellido, email, contrasenia, nick],
            (insertError, insertResults) => {
              if (insertError) {
                console.error(insertError);

              } else {
                const successMessage = 'Cuenta creada con éxito. Inicia sesión ahora.';
                res.redirect(`/login?message=${successMessage}`);
              }
            }
          );
        }

      }
    }
  );
});



// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});