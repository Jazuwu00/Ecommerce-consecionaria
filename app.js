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
    { id: 1, name: 'Aceite de motor', price: 30, category: 'Auto' },
    { id: 2, name: 'Llantas', price: 150, category: 'Auto' },
    { id: 3, name: 'Limpiador de interior', price: 20, category: 'Auto' },
    { id: 4, name: 'Cera para autos', price: 25, category: 'Auto' },
    { id: 5, name: 'Teléfono inteligente', price: 500, category: 'Electrónicos' },
    { id: 6, name: 'Tablet', price: 300, category: 'Electrónicos' },
    { id: 7, name: 'Auriculares inalámbricos', price: 100, category: 'Electrónicos' },
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

// Ruta para procesar la compra
app.post('/checkout', (req, res) => {
  // Procesar la compra aquí (calcular total, procesar pago, etc.)

  // Vaciar el carrito después de la compra
  cart.length = 0;

  // Redirigir a la página de agradecimiento o confirmación de compra
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