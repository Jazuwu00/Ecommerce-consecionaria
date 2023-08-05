const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path'); // Importa el módulo 'path'



// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');


app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const cart = []; // Arreglo para almacenar los productos en el carrito

// Datos de ejemplo (productos para autos y electrónicos)
const products = [
    { id: 1, name: 'Aceite de motor', price: 30, category: 'Autos' },
    { id: 2, name: 'Llantas', price: 150, category: 'Autos' },
    { id: 3, name: 'Limpiador de interior', price: 20, category: 'Autos' },
    { id: 4, name: 'Cera para autos', price: 25, category: 'Autos' },
    { id: 5, name: 'Teléfono', price: 500, category: 'Electronicos' },
    { id: 6, name: 'Tablet', price: 300, category: 'Electronicos' },
    { id: 7, name: 'Auriculares ', price: 100, category: 'Electronicos' },
  ];
  
  // Categorías de productos
  const categories = [...new Set(products.map(product => product.category))];
  
  // Rutas
  // Ruta para agregar productos al carrito
app.post('/addToCart', (req, res) => {
  const productId = parseInt(req.body.productId);
  const product = products.find((p) => p.id === productId);

  if (product) {
    const existingProduct = cart.find((item) => item.id === productId);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
  }

  res.redirect(`/cart`);
})
// Ruta para eliminar productos del carrito
app.post('/removeFromCart', (req, res) => {
  const productId = parseInt(req.body.productId);

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
  const selectedPaymentMethod = req.body.paymentMethod; // Obtener el método de pago seleccionado desde el formulario

  // Aquí puedes agregar la lógica para procesar el pago con el método seleccionado
  // Por ejemplo, realizar una transacción, guardar el pedido en la base de datos, etc.

  // Luego redirige a la página de confirmación o agradecimiento
  res.redirect('/thankyou');
});

// Ruta para mostrar el mensaje de agradecimiento después de completar la compra
app.get('/thankyou', (req, res) => {
  res.render('thankyou');
});


  app.get('/', (req, res) => {
    res.render('index', { categories });
  });
  
  app.get('/products/:category', (req, res) => {
    const category = req.params.category;
    const categoryProducts = products.filter(product => product.category === category);
    res.render('products', { category, products: categoryProducts });
  });
  
  
  app.get('/product/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find((p) => p.id === id);
  
    if (product) {
      res.render('products', { product });
    } else {
      // Si no se encuentra el producto con el ID proporcionado, mostrar un error o redirigir a una página de error.
      res.status(404).send('Producto no encontrado');
    }
  });
  

  // Ruta para mostrar el contenido del carrito
app.get('/cart', (req, res) => {
  res.render('cart', { cart });
});

 
// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});