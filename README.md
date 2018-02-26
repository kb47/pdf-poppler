# pdf-poppler

Convert PDF files into images using Poppler with promises. It achieves 10x faster performance compared to other PDF converters.

## Usage

```javascript
const pdfpoppler = require('pdf-poppler');

let file = 'C:\\tmp\\convertme.pdf'

pdfpoppler.info(file)
    .then(pdfinfo => {
        console.log(pdfinfo);
    });
```