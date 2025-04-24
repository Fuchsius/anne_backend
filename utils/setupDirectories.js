const fs = require('fs');
const path = require('path');

// Ensure all required directories exist
function setupDirectories() {
  const directories = [
    'uploads',
    'uploads/products',
    'uploads/categories',
    'uploads/payment-slips',
    'uploads/receipts'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating directory: ${fullPath}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  console.log('Directory setup complete');
}

module.exports = setupDirectories; 