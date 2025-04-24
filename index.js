const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const setupDirectories = require('./utils/setupDirectories');
const ensureCategoryDirs = require('./utils/ensureCategoryDirs');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log a message to confirm the setup
console.log(`Serving static files from: ${path.join(__dirname, 'uploads')}`);

// Import routers
const userRouter = require("./routes/userRouter");
const addressRouter = require("./routes/addressRouter");
const categoriesRouter = require("./routes/categoriesRouter");
const productsRouter = require("./routes/productsRouter");
const contactRouter = require("./routes/contactRouter");
const statusRouter = require('./routes/statusRouter');
const userRoutes = require('./routes/userRoutes');
const orderRouter = require('./routes/orderRoutes');

// Authentication Middleware
const { authenticate } = require("./middleware/authMiddleware");

// Create the status router if it doesn't exist
if (!statusRouter) {
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });
  app.use('/api/status', router);
} else {
  app.use('/api/status', statusRouter);
}

// Public routes for products (NO authentication)
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);

// Public user routes
app.post("/api/users/login", (req, res, next) => {
  // Extract the login handler from userRouter
  const loginHandler = userRouter.stack.find(layer => 
    layer.route && layer.route.path === '/login' && layer.route.methods.post);
  
  if (loginHandler && loginHandler.route.stack[0].handle) {
    return loginHandler.route.stack[0].handle(req, res, next);
  }
  
  res.status(404).json({ error: "Login endpoint not configured properly" });
});

app.post("/api/users/register", (req, res, next) => {
  // Extract the register handler from userRouter
  const registerHandler = userRouter.stack.find(layer => 
    layer.route && layer.route.path === '/register' && layer.route.methods.post);
  
  if (registerHandler && registerHandler.route.stack[0].handle) {
    return registerHandler.route.stack[0].handle(req, res, next);
  }
  
  res.status(404).json({ error: "Register endpoint not configured properly" });
});

// Protected routes (require authentication)
app.use("/api", authenticate);
app.use("/api/users", userRouter);
app.use("/api/address", addressRouter);
app.use("/api/contact", contactRouter);
app.use('/api/orders', authenticate, orderRouter);

// Register user routes
// app.use('/api/users', userRoutes);

// Start Server
setupDirectories();
ensureCategoryDirs();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add this debug line to your index.js to help identify routing issues
console.log('Available API routes:');
app._router.stack
  .filter(r => r.route)
  .forEach(r => {
    Object.keys(r.route.methods).forEach(method => {
      if (r.route.methods[method]) {
        console.log(`${method.toUpperCase()}: ${r.route.path}`);
      }
    });
  });

// Add this near the top of your index.js file
// Error handler for router loading
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (err.code === 'MODULE_NOT_FOUND' || err.message.includes('is not defined')) {
    console.error('There was a problem loading a module or middleware. Check all imports and exports.');
  }
  // Don't exit the process, just log the error
});

// Add this debug section near the end of your file, before starting the server
// This will print all routes including their paths and methods
console.log('=== API ROUTES ===');

// First print the routes registered directly on app
app._router.stack
  .filter(r => r.route)
  .map(r => {
    console.log(`${Object.keys(r.route.methods).map(m => m.toUpperCase()).join(',')} ${r.route.path}`);
  });

// Then print the routes registered via app.use
app._router.stack
  .filter(r => r.name === 'router')
  .forEach(r => {
    if (r.handle && r.handle.stack) {
      console.log(`\nRouter: ${r.regexp}`);
      r.handle.stack
        .filter(sr => sr.route)
        .forEach(sr => {
          console.log(`  ${Object.keys(sr.route.methods).map(m => m.toUpperCase()).join(',')} ${sr.route.path}`);
        });
    }
  });

console.log('=== END API ROUTES ===');

// Add a root route for a status page when someone visits the backend directly
app.get('/', (req, res) => {
  const packageInfo = require('./package.json');
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isProduction ? 'API Server' : 'Backend Status'}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #f7f7f7;
          color: #333;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .status-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          max-width: 500px;
          width: 100%;
        }
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .status-indicator {
          width: 12px;
          height: 12px;
          background-color: #10B981;
          border-radius: 50%;
          margin-right: 12px;
        }
        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
          margin-top: 1.5rem;
        }
        .label {
          color: #666;
        }
        .value {
          font-weight: 500;
        }
        .api-url {
          margin-top: 1.5rem;
          padding: 1rem;
          background-color: #f1f5f9;
          border-radius: 4px;
          font-family: monospace;
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="status-card">
        <div class="header">
          <div class="status-indicator"></div>
          <h1>${isProduction ? 'API Server' : 'Backend Status'}</h1>
        </div>
        <p>The backend server is currently running.</p>
        
        <div class="info-grid">
          <div class="label">Version:</div>
          <div class="value">${packageInfo.version || '1.0.0'}</div>
          
          <div class="label">Environment:</div>
          <div class="value">${process.env.NODE_ENV || 'development'}</div>
          
          ${!isProduction ? `
          <div class="label">Started at:</div>
          <div class="value">${new Date().toLocaleString()}</div>
          ` : ''}
        </div>
        
        <code class="api-url">API Status endpoint: /api/status</code>
      </div>
    </body>
    </html>
  `);
});

