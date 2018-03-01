const os = require('os');
const path = require('path');

let platform = os.platform();
if (!['darwin', 'win32'].includes(platform)) {
    console.error(`${platform} is NOT supported.`);
    process.exit(1);
}

let popplerPath;

if (platform === 'win32') {
    popplerPath = path.join(
        __dirname,
        'lib',
        'win',
        'poppler-0.51',
        'bin'
    );
}
else if (platform === 'darwin') {
    popplerPath = path.join(
        __dirname,
        'lib',
        'osx',
        'poppler-0.62',
        'bin'
    );
}
else {
    console.error(`${platform} is NOT supported.`);
    process.exit(1);
}

// for electron ASAR
popplerPath = popplerPath.replace(".asar", ".asar.unpacked");

module.exports.path = popplerPath;
module.exports.info = require('./lib/info');
module.exports.convert = require('./lib/convert');