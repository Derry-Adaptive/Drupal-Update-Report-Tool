const fs = require('fs');
const uglify = require('uglify-js');
const clipboardy = require('clipboardy');

const sourceFile = 'full_report_tool.js';
const outputFile = 'bookmarklet.js';

try {
    // 1. Read the source code from full_report_tool.js
    const sourceCode = fs.readFileSync(sourceFile, 'utf8');

    if (!sourceCode || sourceCode.trim() === '') {
        console.warn(`⚠️ ${sourceFile} is empty. Output will be an empty bookmarklet.`);
        // Optionally create an empty bookmarklet or just skip
        fs.writeFileSync(outputFile, 'javascript:void(0);');
        console.log(`📝 ${outputFile} created with empty bookmarklet.`);
        return; // Exit if source is empty
    }

    // 2. Minify the code using uglify-js
    const result = uglify.minify(sourceCode);

    if (result.error) {
        console.error(`❌ Error minifying ${sourceFile}:`, result.error);
        process.exit(1); // Exit with error
    }

    // 3. Prepend 'javascript:' to the minified code
    const bookmarkletCode = `javascript:${result.code}`;

    // 4. Write the result to bookmarklet.js
    fs.writeFileSync(outputFile, bookmarkletCode);
    console.log(`✅ Successfully generated ${outputFile}`);

    // 5. Copy the result to the clipboard
    try {
        clipboardy.writeSync(bookmarkletCode);
        console.log('📋 Bookmarklet code copied to clipboard!');
    } catch (clipError) {
        console.warn('⚠️ Could not copy to clipboard:', clipError.message);
    }

} catch (err) {
    if (err.code === 'ENOENT') {
        console.error(`❌ Error: Source file not found: ${sourceFile}`);
    } else {
        console.error(`❌ An unexpected error occurred:`, err);
    }
    process.exit(1); // Exit with error
}