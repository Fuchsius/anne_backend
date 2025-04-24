const fs = require('fs');
const path = require('path');

// Create a function to ensure the category upload directories exist
function ensureCategoryDirs() {
  const uploadsDir = path.join(__dirname, '../uploads');
  const categoriesDir = path.join(uploadsDir, 'categories');
  
  // Create the uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create the categories directory if it doesn't exist
  if (!fs.existsSync(categoriesDir)) {
    console.log('Creating categories upload directory');
    fs.mkdirSync(categoriesDir, { recursive: true });
  }
  
  console.log('Category upload directories verified');
}

module.exports = ensureCategoryDirs; 