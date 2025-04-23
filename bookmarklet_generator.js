const fs = require('fs');
const uglify = require('uglify-js');

// Read the code from full_report_tool.js
const code = fs.readFileSync('full_report_tool.js', 'utf8');

// Minify the code
const minified = uglify.minify(code).code;

// Create the bookmarklet code
const bookmarkletCode = `javascript:${encodeURIComponent(minified)}`;

// Write the bookmarklet code to bookmarklet.js
fs.writeFileSync('bookmarklet.js', bookmarkletCode);

console.log('Bookmarklet generated!');