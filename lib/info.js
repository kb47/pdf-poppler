const path = require('path');
const {execFile} = require('child_process');
const EXEC_OPTS = require('../index').exec_options;

let popplerPath = require('../index').path;

// List of all expected pdfinfo fields
// https://www.xpdfreader.com/pdfinfo-man.html#NAME
const PDF_METADATA_KEYS = [
  "Title",
  "Author",
  "Producer",
  "CreationDate",
  "ModDate",
  "Tagged",
  "UserProperties",
  "Suspects",
  "Form",
  "JavaScript",
  "Pages",
  "Encrypted",
  "Page size",
  "Page rot",
  "File size",
  "Optimized",
  "PDF version"
];

function parsePdfInfo(stdout) {
    const lines = stdout.trim().split(/\r?\n/);
    const result = {};
    let currentKey = null;

    for (let line of lines) {
        const colonIndex = line.indexOf(':');

        if (colonIndex !== -1) {
            // New key/value line
            const potentialKey = line.substring(0, colonIndex).trim();
            if (PDF_METADATA_KEYS.includes(potentialKey)) {
                currentKey = potentialKey.replace(/ /g, "_").toLowerCase();
                const value = line.substring(colonIndex + 1).trim();
                result[currentKey] = value;
            } else {
                // Unknown field → ignore
                currentKey = null;
            }
        } else {
            // Continuation of previous line
            if (currentKey) {
                result[currentKey] += '\n' + line;
            }
        }
    }

    // parse page_size into width/height
    if (result.page_size) {
        const dims = result.page_size.split('x').map(s => s.trim());
        if (dims.length >= 2) {
            result.width_in_pts = parseFloat(dims[0]);
            result.height_in_pts = parseFloat(dims[1]);
        }
    }

    return result;
}

module.exports = function(file) {
    return new Promise((resolve, reject) => {
        execFile(path.join(popplerPath, 'pdfinfo'), [file], EXEC_OPTS, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                const nfoObj = parsePdfInfo(stdout);
                resolve(nfoObj);
            }
        });
    });
};
