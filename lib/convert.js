const path = require('path');
const {execFile} = require('child_process');

const FORMATS = ['png', 'jpeg', 'tiff', 'pdf', 'ps', 'eps', 'svg'];
const EXEC_OPTS = {encoding: 'utf8', shell: process.env.SHELL};

let popplerPath = path.join(
    __dirname,
    'win',
    'poppler-0.51',
    'bin'
);

// for electron ASAR
popplerPath = popplerPath.replace(".asar", ".asar.unpacked");

let defaultOptions = {
    format: 'jpeg',
    out_dir: null,
    out_prefix: null,
    page: null
};

// module.exports = function (file, out_file, page_start, page_end) {
module.exports = function (file, opts) {
    return new Promise((resolve, reject) => {
        opts.format = FORMATS.includes(opts.format) ? opts.format : defaultOptions.format;
        opts.out_dir = opts.out_dir || defaultOptions.out_dir;
        opts.out_prefix = opts.out_prefix || path.dirname(file);
        opts.out_prefix = opts.out_prefix || path.basename(file, path.extname(file));
        opts.page = opts.page || defaultOptions.page;

        if (opts.page) {
            execFile(path.join(popplerPath, 'pdftocairo.exe'), [[`-${opts.format}`], ['-f'], [parseInt(opts.page)],  ['-l'], [parseInt(opts.page)], `${file}`, `${path.join(opts.out_dir, opts.out_prefix)}`], EXEC_OPTS, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(stdout);
                }
            });
        }
        else {
            execFile(path.join(popplerPath, 'pdftocairo.exe'), [[`-${opts.format}`], `${file}`, `${path.join(opts.out_dir, opts.out_prefix)}`], EXEC_OPTS, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(stdout);
                }
            });
        }


    });
};