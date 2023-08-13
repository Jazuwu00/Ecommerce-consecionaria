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


const products = [
    { id: 1, name: 'Chevrolet', price: 30, category: 'Autos',imageUrl: '/images/autos/chevrolet.jpg'},
    { id: 2, name: 'Chevrolet Onix', price: 150, category: 'Autos' ,imageUrl: '/images/autos/chevroletonix-plus.jpg'},
    { id: 3, name: 'Chevrolet Cruze', price: 20, category: 'Autos' ,imageUrl: '/images/autos/cruze-rs.jpg' },
    { id: 4, name: 'Chevrolet Joy', price: 25, category: 'Autos' ,imageUrl: '/images/autos/chevrolet-joy.jpg'},
    { id: 5, name: 'Chevrolet Joy plus', price: 500, category: 'Autos' ,imageUrl: '/images/autos/chevrolet-joy-plus.jpg' },
    { id: 6, name: 'Cera para autos', price: 300, category: 'Articulos' ,imageUrl: '/images/productos/CeraAuto.jpg'},
    { id: 7, name: 'NavegadorGps', price: 100, category: 'Articulos' ,imageUrl: '/images/productos/navegadorGps.jpg'},
    { id: 8, name: 'Llantas', price: 100, category: 'Articulos' ,imageUrl: '/images/productos/llantas.jpg'},
    { id: 9, name: 'Aceite de motor', price: 100, category: 'Articulos' ,imageUrl: '/images/productos/AceiteDeMotor.jpg'},
  ];
  
  // Categorías de productos
  const categories = [...new Set(products.map(product => product.category))];
  
  // Rutas
  
  // Ruta para agregar productos al carrito
  app.get('/addToCart/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find((p) => p.id === productId);
  
    if (product) {
      const existingProduct = cart.find((item) => item.id === productId);
  
      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
  
      res.redirect('/cart'); // Redirige al carrito después de agregar el producto
    } else {
      return res.status(404).send('Producto no encontrado');
    }
  });
 
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
    res.render('index', { categories });
  });
  
//ruta que muestra distintos productos segun su categoria
  app.get('/products/:category', (req, res) => {
    const category = req.params.category;
    const categoryProducts = products.filter(product => product.category === category);
    res.render('products', { category, products: categoryProducts });
  });
  
  


  // Ruta para mostrar el contenido del carrito
app.get('/cart', (req, res) => {
  res.render('cart', { cart });
});

  // Ruta para visualizar un producto específico
app.get('/product/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(prod => prod.id === productId);

  if (!product) {
    return res.status(404).send('Producto no encontrado');
  }

  res.render('product', { product });
});
 
// Iniciar el servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});