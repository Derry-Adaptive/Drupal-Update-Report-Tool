const fs = require('fs');
const uglify = require('uglify-js');

// Read the unmodified code from full_report_tool.js
const code = fs.readFileSync('full_report_tool.js', 'utf8');

// Set compression to full for maximum size reduction
const compressionLevel = 'full'; 

let processedCode;
try {
  // Full minification with aggressive settings
  processedCode = uglify.minify(code, {
    compress: {
      sequences: true,
      dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
      drop_console: false,  // Keep console logs as they're important for output
      collapse_vars: true,
      reduce_vars: true,
      passes: 3,            // Multiple compression passes
      global_defs: {        // Remove debug code
        DEBUG: false
      }
    },
    mangle: {
      toplevel: true,       // More aggressive variable renaming
      reserved: ['generateUpdateReport'] // Don't mangle the main function name
    },
    output: {
      comments: false,
      beautify: false,
      semicolons: true,
      preamble: null
    }
  }).code;
  
  if (!processedCode) {
    throw new Error('Minification failed without error details');
  }
} catch (error) {
  console.error('Error processing JavaScript:', error);
  console.log('Falling back to basic comment removal...');
  
  // Simple fallback that just removes comments
  processedCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\/\/.*/g, '');          // Remove single-line comments
}

// Create the bookmarklet code with IIFE
const bookmarkletCode = `javascript:(function(){${processedCode}})()`;

// Write the bookmarklet code to bookmarklet.js
fs.writeFileSync('bookmarklet.js', bookmarkletCode);

// Output information about the process
console.log(`Bookmarklet generated! (fully minified)`);

// Calculate and display size info
const originalSize = code.length;
const compressedSize = processedCode.length;
const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
console.log(`Size: ${compressedSize} bytes (${reduction}% reduction from ${originalSize} bytes)`);

// Display warning if bookmarklet is still large
if (bookmarkletCode.length > 2000) {
  console.log(`\nWarning: Bookmarklet size (${bookmarkletCode.length} bytes) may be too large for some browsers.`);
  console.log(`Consider further reducing functionality if size is critical.`);
}