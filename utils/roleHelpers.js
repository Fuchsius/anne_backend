// Add this to a new utility file
const isAdmin = (user) => user && user.role === 3;
const isUser = (user) => user && user.role === 1;

module.exports = {
  isAdmin,
  isUser
}; 