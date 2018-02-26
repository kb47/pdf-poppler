# pdf-poppler

Convert PDF files into images using Poppler with promises. It achieves 10x faster performance compared to other PDF converters.

**Note: Currently it works on Windows only.**

## Installation
```
  $ npm install pdf-poppler
```

## Usage

```javascript
const pdfpoppler = require('pdf-poppler');

let file = 'C:\\tmp\\convertme.pdf'

pdfpoppler.info(file)
    .then(pdfinfo => {
        console.log(pdfinfo);
    });
```

```javascript
const path = require('path');
const pdfpoppler = require('pdf-poppler');

let file = 'C:\\tmp\\convertme.pdf'

let opts = {
    format: 'jpeg',
    out_dir: path.dirname(file),
    out_prefix: path.baseName(file, path.extname(file)),
    page: null
}

pdfpoppler.convert(file, opts)
    .then(res => {
        console.log('Successfully converted');
    })
    .catch(error => {
        console.error(error);
    })
```