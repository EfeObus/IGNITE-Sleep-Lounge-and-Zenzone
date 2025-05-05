/**
 * Custom patch for path-to-regexp to handle problematic URL patterns
 * This file should be required at the very beginning of server.js
 */

console.log('Initializing path-to-regexp patch...');

// Store the original Module.prototype.require
const Module = require('module');
const originalRequire = Module.prototype.require;

// Override the require function to intercept path-to-regexp loading
Module.prototype.require = function(path) {
  // Call the original require function
  const exports = originalRequire.apply(this, arguments);
  
  // Only patch the path-to-regexp module
  if (path === 'path-to-regexp') {
    console.log('Patching path-to-regexp module');
    
    // Store the original pathToRegexp function
    const originalPathToRegexp = exports.pathToRegexp;
    
    if (originalPathToRegexp) {
      // Override pathToRegexp with our custom function
      exports.pathToRegexp = function(path, keys, options) {
        // Handle URLs and other problematic patterns
        if (typeof path === 'string') {
          if (path.startsWith('http://') || path.startsWith('https://')) {
            console.log('Intercepted URL in path-to-regexp:', path);
            // Replace with a safe route pattern
            path = '/safe-route';
          }
        }
        
        // Try to call the original function with our modified path
        try {
          return originalPathToRegexp(path, keys, options);
        } catch (error) {
          // If it still fails, log the error and use a fallback
          if (error.message && (error.message.includes('Missing parameter') || error.message.includes('Missing parameter name'))) {
            console.log('Error in path-to-regexp with path:', path);
            console.log('Error details:', error.message);
            console.log('Using fallback safe route');
            return originalPathToRegexp('/safe-route', keys, options);
          }
          // For other errors, re-throw
          throw error;
        }
      };
    }
  }
  
  return exports;
};

// Also patch the global error handler for path-to-regexp errors
process.on('uncaughtException', (error) => {
  if (error.message && (error.message.includes('Missing parameter name') || error.message.includes('Missing parameter'))) {
    console.error('Caught path-to-regexp error:', error.message);
    // Allow the application to continue
  } else {
    // Re-throw other errors
    console.error('Uncaught exception:', error);
    // Still throw fatal errors in production
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
});

console.log('Path-to-regexp patch initialization complete');