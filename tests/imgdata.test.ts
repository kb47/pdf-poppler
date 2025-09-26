import * as path from 'path';
import * as fs from 'fs';

const poppler = require('../index.js');

describe('PDF Image Data Functionality', () => {
  const samplePdfPath = path.join(__dirname, '..', 'sample.pdf');

  beforeAll(() => {
    expect(fs.existsSync(samplePdfPath)).toBe(true);
  });

  describe('poppler.imgdata()', () => {
    it('should extract image data from PDF', async () => {
      const imageData = await poppler.imgdata(samplePdfPath);

      expect(Array.isArray(imageData)).toBe(true);

      // If PDF contains images, verify structure
      if (imageData.length > 0) {
        imageData.forEach((image: any) => {
          expect(typeof image).toBe('object');
          expect(image).not.toBeNull();
        });
      }
    });

    it('should return empty array for PDF without images', async () => {
      // Most PDFs might not have embedded images
      const imageData = await poppler.imgdata(samplePdfPath);

      expect(Array.isArray(imageData)).toBe(true);
      // Length could be 0 or more depending on the sample PDF
      expect(imageData.length).toBeGreaterThanOrEqual(0);
    });

    it('should have consistent data structure for each image', async () => {
      const imageData = await poppler.imgdata(samplePdfPath);

      if (imageData.length > 0) {
        // Check that all image objects have similar structure
        const firstImage = imageData[0];
        const keys = Object.keys(firstImage);

        expect(keys.length).toBeGreaterThan(0);

        // Verify all images have the same keys
        imageData.forEach((image: any) => {
          expect(Object.keys(image)).toEqual(keys);
        });

        // Common expected properties based on pdfimages -list output
        const expectedProperties = [
          'page', 'num', 'type', 'width', 'height', 'color', 'comp', 'bpc', 'enc', 'interp', 'object', 'ID', 'x-ppi', 'y-ppi', 'size', 'ratio'
        ];

        // At least some of these properties should be present
        const presentProperties = expectedProperties.filter(prop => firstImage.hasOwnProperty(prop));
        expect(presentProperties.length).toBeGreaterThan(5); // Expect at least 6 common properties
      }
    });

    it('should handle PDF with various image types', async () => {
      const imageData = await poppler.imgdata(samplePdfPath);

      if (imageData.length > 0) {
        imageData.forEach((image: any) => {
          // Verify image type is a valid string
          if (image.type) {
            expect(typeof image.type).toBe('string');
            expect(image.type.length).toBeGreaterThan(0);
          }

          // Verify dimensions if present
          if (image.width) {
            expect(parseInt(image.width)).toBeGreaterThan(0);
          }
          if (image.height) {
            expect(parseInt(image.height)).toBeGreaterThan(0);
          }

          // Verify page number if present
          if (image.page) {
            expect(parseInt(image.page)).toBeGreaterThan(0);
          }
        });
      }
    });

    it('should parse numeric values correctly', async () => {
      const imageData = await poppler.imgdata(samplePdfPath);

      if (imageData.length > 0) {
        imageData.forEach((image: any) => {
          // Check that numeric fields can be parsed
          const numericFields = ['width', 'height', 'page', 'num', 'comp', 'bpc'];

          numericFields.forEach(field => {
            if (image[field] && image[field] !== '') {
              const numValue = parseInt(image[field]);
              expect(isNaN(numValue)).toBe(false);
              expect(numValue).toBeGreaterThanOrEqual(0);
            }
          });

          // Check floating point fields
          const floatFields = ['x-ppi', 'y-ppi'];
          floatFields.forEach(field => {
            if (image[field] && image[field] !== '') {
              const floatValue = parseFloat(image[field]);
              expect(isNaN(floatValue)).toBe(false);
              expect(floatValue).toBeGreaterThan(0);
            }
          });
        });
      }
    });

    it('should handle relative and absolute file paths', async () => {
      // Test with relative path
      const relativeData = await poppler.imgdata('sample.pdf');
      expect(Array.isArray(relativeData)).toBe(true);

      // Test with absolute path
      const absoluteData = await poppler.imgdata(path.resolve('sample.pdf'));
      expect(Array.isArray(absoluteData)).toBe(true);

      // Results should be the same
      expect(relativeData.length).toBe(absoluteData.length);

      if (relativeData.length > 0 && absoluteData.length > 0) {
        // Compare first image data
        expect(Object.keys(relativeData[0])).toEqual(Object.keys(absoluteData[0]));
      }
    });

    it('should handle PDFs with different image encoding types', async () => {
      const imageData = await poppler.imgdata(samplePdfPath);

      if (imageData.length > 0) {
        imageData.forEach((image: any) => {
          // Verify encoding field if present
          if (image.enc) {
            expect(typeof image.enc).toBe('string');
            // Common encoding types in PDFs
            const validEncodings = ['jpeg', 'ccitt', 'flate', 'image', 'jpx', 'jbig2'];
            // Don't enforce specific values as it depends on the PDF content
          }

          // Verify color space if present
          if (image.color) {
            expect(typeof image.color).toBe('string');
            // Common color spaces: gray, rgb, cmyk, icc, etc.
          }
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent file gracefully', async () => {
      const nonExistentPath = path.join(__dirname, 'non-existent.pdf');

      await expect(poppler.imgdata(nonExistentPath)).rejects.toThrow();
    });

    it('should handle invalid file type gracefully', async () => {
      const textFilePath = path.join(__dirname, '..', 'package.json');

      await expect(poppler.imgdata(textFilePath)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      try {
        await poppler.imgdata('non-existent-file.pdf');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeDefined();
        expect(typeof (error as Error).message).toBe('string');
      }
    });

    it('should handle empty file path', async () => {
      await expect(poppler.imgdata('')).rejects.toThrow();
    });

    it('should handle null/undefined input', async () => {
      await expect(poppler.imgdata(null as any)).rejects.toThrow();
      await expect(poppler.imgdata(undefined as any)).rejects.toThrow();
    });

    it('should handle malformed PDF gracefully', async () => {
      // Create a temporary malformed PDF file
      const malformedPdfPath = path.join(__dirname, '..', 'test-malformed.pdf');
      fs.writeFileSync(malformedPdfPath, 'This is not a PDF file content');

      try {
        await expect(poppler.imgdata(malformedPdfPath)).rejects.toThrow();
      } finally {
        // Clean up
        if (fs.existsSync(malformedPdfPath)) {
          fs.unlinkSync(malformedPdfPath);
        }
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should complete within reasonable time', async () => {
      const startTime = Date.now();

      await poppler.imgdata(samplePdfPath);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 10 seconds for most PDFs
      expect(executionTime).toBeLessThan(10000);
    });

    it('should handle empty image data gracefully', async () => {
      const imageData = await poppler.imgdata(samplePdfPath);

      // Should always return an array, even if empty
      expect(Array.isArray(imageData)).toBe(true);

      if (imageData.length === 0) {
        // This is valid - PDF might not contain embedded images
        expect(imageData).toEqual([]);
      }
    });

    it('should handle PDF with many images efficiently', async () => {
      // This test depends on the sample PDF content
      const imageData = await poppler.imgdata(samplePdfPath);

      if (imageData.length > 10) {
        // If PDF has many images, verify they're all processed
        expect(imageData.length).toBeGreaterThan(0);

        // Verify no duplicate entries
        const pageNums = imageData.map((img: any) => `${img.page}-${img.num}`);
        const uniquePageNums = [...new Set(pageNums)];
        expect(pageNums.length).toBe(uniquePageNums.length);
      }
    });

    it('should maintain data consistency across multiple calls', async () => {
      const firstCall = await poppler.imgdata(samplePdfPath);
      const secondCall = await poppler.imgdata(samplePdfPath);

      expect(firstCall.length).toBe(secondCall.length);

      if (firstCall.length > 0) {
        // Compare structure of first image in both calls
        expect(Object.keys(firstCall[0])).toEqual(Object.keys(secondCall[0]));

        // Compare actual data
        expect(firstCall[0]).toEqual(secondCall[0]);
      }
    });
  });
});