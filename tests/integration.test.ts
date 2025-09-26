import * as path from 'path';
import * as fs from 'fs';

const poppler = require('../index.js');

describe('Integration Tests', () => {
  const samplePdfPath = path.join(__dirname, '..', 'sample.pdf');
  const testOutputDir = path.join(__dirname, '..', 'test-output');

  beforeAll(() => {
    expect(fs.existsSync(samplePdfPath)).toBe(true);
  });

  describe('End-to-End PDF Processing', () => {
    it('should complete full PDF processing workflow', async () => {
      // Step 1: Get PDF info
      const info = await poppler.info(samplePdfPath);
      expect(info).toBeDefined();
      expect(info.pages).toBeDefined();

      const pageCount = parseInt(info.pages);
      expect(pageCount).toBeGreaterThan(0);

      // Step 2: Extract image data
      const imageData = await poppler.imgdata(samplePdfPath);
      expect(Array.isArray(imageData)).toBe(true);

      // Step 3: Convert to images
      const convertOptions = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'integration-test',
        page: null
      };

      await poppler.convert(samplePdfPath, convertOptions);

      // Verify conversion results
      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file =>
        file.startsWith('integration-test') && file.endsWith('.png')
      );

      expect(pngFiles.length).toBeGreaterThan(0);
      expect(pngFiles.length).toBeLessThanOrEqual(pageCount);

      // Verify file sizes are reasonable
      pngFiles.forEach(file => {
        const filePath = path.join(testOutputDir, file);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      });
    });

    it('should handle different format conversions consistently', async () => {
      const formats = ['png', 'jpeg'];
      const results: { [key: string]: string[] } = {};

      for (const format of formats) {
        const options = {
          format: format,
          out_dir: testOutputDir,
          out_prefix: `integration-${format}`,
          page: 1
        };

        await poppler.convert(samplePdfPath, options);

        const files = fs.readdirSync(testOutputDir);
        const formatFiles = files.filter(file =>
          file.startsWith(`integration-${format}`)
        );

        results[format] = formatFiles;
        expect(formatFiles.length).toBe(1);
      }

      // Verify both formats created files
      expect(results.png.length).toBe(1);
      expect(results.jpeg.length).toBe(1);

      // Compare file sizes (PNG typically larger than JPEG)
      const pngPath = path.join(testOutputDir, results.png[0]);
      const jpegPath = path.join(testOutputDir, results.jpeg[0]);

      const pngSize = fs.statSync(pngPath).size;
      const jpegSize = fs.statSync(jpegPath).size;

      expect(pngSize).toBeGreaterThan(0);
      expect(jpegSize).toBeGreaterThan(0);
      // PNG is usually larger than JPEG for the same content
      expect(pngSize).toBeGreaterThan(jpegSize * 0.5); // Allow for variation
    });

    it('should maintain consistency across multiple operations', async () => {
      // Run info extraction multiple times
      const info1 = await poppler.info(samplePdfPath);
      const info2 = await poppler.info(samplePdfPath);

      expect(info1.pages).toBe(info2.pages);
      expect(info1.width_in_pts).toBe(info2.width_in_pts);
      expect(info1.height_in_pts).toBe(info2.height_in_pts);

      // Run image data extraction multiple times
      const imgdata1 = await poppler.imgdata(samplePdfPath);
      const imgdata2 = await poppler.imgdata(samplePdfPath);

      expect(imgdata1.length).toBe(imgdata2.length);

      // Run conversion multiple times
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'consistency-test',
        page: 1
      };

      await poppler.convert(samplePdfPath, options);
      const files1 = fs.readdirSync(testOutputDir).filter(f => f.startsWith('consistency-test'));

      // Clean up first conversion
      files1.forEach(file => fs.unlinkSync(path.join(testOutputDir, file)));

      await poppler.convert(samplePdfPath, options);
      const files2 = fs.readdirSync(testOutputDir).filter(f => f.startsWith('consistency-test'));

      expect(files1.length).toBe(files2.length);
      expect(files1[0]).toBe(files2[0]); // Same filename
    });

    it('should handle concurrent operations safely', async () => {
      const concurrentOperations = [
        poppler.info(samplePdfPath),
        poppler.imgdata(samplePdfPath),
        poppler.convert(samplePdfPath, {
          format: 'png',
          out_dir: testOutputDir,
          out_prefix: 'concurrent-1',
          page: 1
        }),
        poppler.convert(samplePdfPath, {
          format: 'jpeg',
          out_dir: testOutputDir,
          out_prefix: 'concurrent-2',
          page: 1
        })
      ];

      const results = await Promise.all(concurrentOperations);

      // Verify all operations completed
      expect(results).toHaveLength(4);

      // Verify info result
      expect(results[0]).toHaveProperty('pages');

      // Verify imgdata result
      expect(Array.isArray(results[1])).toBe(true);

      // Verify both conversions created files
      const files = fs.readdirSync(testOutputDir);
      const concurrent1Files = files.filter(f => f.startsWith('concurrent-1'));
      const concurrent2Files = files.filter(f => f.startsWith('concurrent-2'));

      expect(concurrent1Files.length).toBe(1);
      expect(concurrent2Files.length).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    it('should complete info extraction within reasonable time', async () => {
      const startTime = Date.now();

      await poppler.info(samplePdfPath);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 5 seconds
      expect(executionTime).toBeLessThan(5000);
    });

    it('should complete image conversion within reasonable time', async () => {
      const startTime = Date.now();

      await poppler.convert(samplePdfPath, {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'performance-test',
        page: 1
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 10 seconds
      expect(executionTime).toBeLessThan(10000);

      // Verify file was created
      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(f => f.startsWith('performance-test'));
      expect(pngFiles.length).toBe(1);
    });

    it('should handle multiple page conversion efficiently', async () => {
      const info = await poppler.info(samplePdfPath);
      const pageCount = parseInt(info.pages);

      if (pageCount > 1) {
        const startTime = Date.now();

        await poppler.convert(samplePdfPath, {
          format: 'jpeg',
          out_dir: testOutputDir,
          out_prefix: 'multi-page-perf',
          page: null // All pages
        });

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Should complete within reasonable time relative to page count
        const expectedMaxTime = Math.max(15000, pageCount * 2000); // 2 seconds per page minimum, 15 seconds minimum
        expect(executionTime).toBeLessThan(expectedMaxTime);

        // Verify all pages were converted
        const files = fs.readdirSync(testOutputDir);
        const jpegFiles = files.filter(f => f.startsWith('multi-page-perf'));
        expect(jpegFiles.length).toBeGreaterThanOrEqual(1);
        expect(jpegFiles.length).toBeLessThanOrEqual(pageCount);
      }
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary file system issues', async () => {
      // Test with invalid output directory first
      const invalidOptions = {
        format: 'png',
        out_dir: '/invalid/path/that/does/not/exist',
        out_prefix: 'recovery-test',
        page: 1
      };

      await expect(poppler.convert(samplePdfPath, invalidOptions)).rejects.toThrow();

      // Should still work with valid options after error
      const validOptions = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'recovery-test-valid',
        page: 1
      };

      await expect(poppler.convert(samplePdfPath, validOptions)).resolves.not.toThrow();

      // Verify file was created
      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(f => f.startsWith('recovery-test-valid'));
      expect(pngFiles.length).toBe(1);
    });

    it('should handle mixed valid and invalid operations', async () => {
      const operations = [
        poppler.info(samplePdfPath), // Valid
        poppler.info('non-existent.pdf'), // Invalid
        poppler.convert(samplePdfPath, { // Valid
          format: 'png',
          out_dir: testOutputDir,
          out_prefix: 'mixed-ops-valid',
          page: 1
        })
      ];

      const results = await Promise.allSettled(operations);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      // Verify the valid conversion worked
      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(f => f.startsWith('mixed-ops-valid'));
      expect(pngFiles.length).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should produce consistent image outputs for same input', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'integrity-test-1',
        page: 1
      };

      // First conversion
      await poppler.convert(samplePdfPath, options);
      const files1 = fs.readdirSync(testOutputDir);
      const png1 = files1.find(f => f.startsWith('integrity-test-1'));
      expect(png1).toBeDefined();

      const size1 = fs.statSync(path.join(testOutputDir, png1!)).size;

      // Second conversion with different prefix
      options.out_prefix = 'integrity-test-2';
      await poppler.convert(samplePdfPath, options);
      const files2 = fs.readdirSync(testOutputDir);
      const png2 = files2.find(f => f.startsWith('integrity-test-2'));
      expect(png2).toBeDefined();

      const size2 = fs.statSync(path.join(testOutputDir, png2!)).size;

      // File sizes should be very similar (allow small variance for metadata)
      const sizeDifference = Math.abs(size1 - size2);
      const allowedVariance = Math.max(size1, size2) * 0.01; // 1% variance
      expect(sizeDifference).toBeLessThan(allowedVariance);
    });
  });
});