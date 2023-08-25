const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path'); // Importa el módulo 'path'
const mysql = require('mysql2');

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
app.post('/payment', (req, res) => {
  
  const paymentMethods = [
    { id: 1, name: 'Tarjeta de crédito' },
    { id: 2, name: 'PayPal' },
    
  ];

  res.render('paymentMethods', { paymentMethods });
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

 
// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});