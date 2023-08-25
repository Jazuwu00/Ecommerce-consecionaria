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


// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');


app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const cart = []; // Arreglo para almacenar los productos en el carrito


  
  // Rutas
  
  // Ruta para agregar productos al carrito
  app.get('/addToCart/:id', (req, res) => {
    const autoIdToShow = req.params.id;
  
    connection.query(
      'SELECT * FROM autodisponible0km WHERE codAD0KM = ?',
      [autoIdToShow],
      (error, results) => {
        if (error) {
          res.status(500).send('Error al obtener el auto');
        } else if (results.length > 0) {
          const existingProduct = cart.find(item => item.id === autoIdToShow);
  
          if (existingProduct) {
            
            existingProduct.quantity += 1;
          } else {
           
            cart.push({ id: autoIdToShow, quantity: 1, ...results[0] });
          }
  
          // Redireccionar al carrito o mostrar un mensaje de éxito
          res.redirect('/cart');
          console.log(cart)
        } else {
          res.send('No se encontró el auto');
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
  // Supongamos que tienes una lista de métodos de pago disponibles
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

// ruta principal
  app.get('/', (req, res) => {
    res.render('index');
  });


  // Ruta para mostrar los autos desde la base de datos
app.get('/autos', (req, res) => {
  const query = 'SELECT * FROM autodisponible0km';
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving autos:', err);
      res.status(500).send('Error retrieving autos');
      return;
    }
    
    // Renderiza la página 'autos' con los resultados de la consulta
    res.render('autos', { autos: results });
  });
});

// Ruta para mostrar los productos desde la base de datos
app.get('/productos', (req, res) => {
  const query = 'SELECT * FROM accesorio';
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving products:', err);
      res.status(500).send('Error retrieving products');
      return;
    }
    
    // Renderiza la página 'productos' con los resultados de la consulta
    res.render('productos', { productos: results });
  });
});
  
  // Ruta para mostrar el contenido del carrito
app.get('/cart', (req, res) => {
  res.render('cart', { cart });
});



  // Ruta para visualizar un producto específico



app.get('/autos/:id', (req, res) => {
  const autoIdToShow = req.params.id;

  connection.query(
    'SELECT * FROM autodisponible0km WHERE codAD0KM = ?',
    [autoIdToShow],
    (error, results) => {
      if (error) {
        res.status(500).send('Error al obtener el auto');
      } else if (results.length > 0) {
        const autoToShow = results[0];
        res.render('auto', { auto: autoToShow });
      } else {
        res.send('No se encontró el auto con el ID ' + autoIdToShow);
      }
    }
  );
});

 
// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});