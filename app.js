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
    res.render('product', { product });
  });
  
  // Iniciar el servidor
  const port = 3000;
  app.listen(port, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${port}`);
  });