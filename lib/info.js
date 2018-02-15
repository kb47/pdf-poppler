const path = require('path');
const {execFile} = require('child_process');

let popplerPath = path.join(
    __dirname,
    'win',
    'poppler-0.51',
    'bin'
);

module.exports = function (file) {
    return new Promise((resolve, reject) => {
        execFile(path.join(popplerPath, 'pdfinfo.exe'), [file], (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                let nfo = stdout.split(/\r?\n/);
                nfoObj = {};
                nfo.forEach(node => {
                    // split by first colon
                    let n = node.replace(/(^:)|(:$)/, '').split(/:(.+)/);
                    if (n[0]) {
                        nfoObj[n[0]] = n[1].trim();
                    }
                });
                resolve(nfoObj);
            }
        });
    });
};
