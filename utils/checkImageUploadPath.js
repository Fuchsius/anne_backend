const fs = require('fs');
const path = require('path');

// This script will check all required directories and permissions
console.log("=== IMAGE UPLOAD PATH CHECK ===");

// Check base directories
const baseDirs = ['uploads', 'uploads/products'];
baseDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  console.log(`Checking: ${fullPath}`);
  
  // Check if directory exists
  if (fs.existsSync(fullPath)) {
    console.log(`✓ Directory exists`);
    
    // Check permissions
    try {
      // Test write permission by creating a test file
      const testFile = path.join(fullPath, '_test_permission.txt');
      fs.writeFileSync(testFile, 'test');
      console.log(`✓ Directory is writable`);
      
      // Clean up test file
      fs.unlinkSync(testFile);
    } catch (err) {
      console.log(`✗ Directory permission error: ${err.message}`);
    }
  } else {
    console.log(`✗ Directory does not exist`);
    
    // Try to create it
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✓ Directory created successfully`);
    } catch (err) {
      console.log(`✗ Failed to create directory: ${err.message}`);
    }
  }
  
  console.log('--------------------------');
});

// Check for multer availability
try {
  require('multer');
  console.log("✓ Multer is installed");
} catch (err) {
  console.log("✗ Multer is not installed properly:", err.message);
}

console.log("=== CHECK COMPLETE ==="); 