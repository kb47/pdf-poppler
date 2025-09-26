import * as path from 'path';
import * as fs from 'fs';

const poppler = require('../index.js');

describe('PDF Convert Functionality', () => {
  const samplePdfPath = path.join(__dirname, '..', 'sample.pdf');
  const testOutputDir = path.join(__dirname, '..', 'test-output');

  beforeAll(() => {
    expect(fs.existsSync(samplePdfPath)).toBe(true);
  });

  describe('poppler.convert() - Basic Conversion', () => {
    it('should convert PDF to PNG format', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-png-page',
        page: null
      };

      await poppler.convert(samplePdfPath, options);

      // Check that PNG files were created
      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file => file.startsWith('test-png-page') && file.endsWith('.png'));

      expect(pngFiles.length).toBeGreaterThan(0);

      // Verify file size is reasonable (not empty)
      pngFiles.forEach(file => {
        const filePath = path.join(testOutputDir, file);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      });
    });

    it('should convert PDF to JPEG format', async () => {
      const options = {
        format: 'jpeg',
        out_dir: testOutputDir,
        out_prefix: 'test-jpeg-page',
        page: null
      };

      await poppler.convert(samplePdfPath, options);

      // Check that JPEG files were created
      const files = fs.readdirSync(testOutputDir);
      const jpegFiles = files.filter(file => file.startsWith('test-jpeg-page') && file.endsWith('.jpg'));

      expect(jpegFiles.length).toBeGreaterThan(0);

      // Verify file size is reasonable
      jpegFiles.forEach(file => {
        const filePath = path.join(testOutputDir, file);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(500); // At least 500B (JPEG is more compressed)
      });
    });

    it('should convert single page when page option is specified', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-single-page',
        page: 1
      };

      await poppler.convert(samplePdfPath, options);

      // Check that exactly one PNG file was created
      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file => file.startsWith('test-single-page') && file.endsWith('.png'));

      expect(pngFiles.length).toBe(1);
      expect(pngFiles[0]).toBe('test-single-page-1.png');
    });

    it('should handle different scale options', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-scale-512',
        page: 1,
        scale: 512
      };

      await poppler.convert(samplePdfPath, options);

      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file => file.startsWith('test-scale-512') && file.endsWith('.png'));

      expect(pngFiles.length).toBe(1);

      // Verify the file exists and has content
      const filePath = path.join(testOutputDir, pngFiles[0]);
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(1000);
    });
  });

  describe('poppler.convert() - Format Support', () => {
    const supportedFormats = ['png', 'jpeg', 'tiff', 'pdf', 'ps', 'eps', 'svg'];

    supportedFormats.forEach(format => {
      it(`should support ${format} format`, async () => {
        const options = {
          format: format,
          out_dir: testOutputDir,
          out_prefix: `test-format-${format}`,
          page: 1
        };

        await expect(poppler.convert(samplePdfPath, options)).resolves.not.toThrow();
      });
    });

    it('should fallback to default format for unsupported format', async () => {
      const options = {
        format: 'unsupported_format' as any,
        out_dir: testOutputDir,
        out_prefix: 'test-unsupported',
        page: 1
      };

      // Should not throw error and fallback to default (jpeg)
      await expect(poppler.convert(samplePdfPath, options)).resolves.not.toThrow();

      // Check that a JPEG file was created (default format)
      const files = fs.readdirSync(testOutputDir);
      const jpegFiles = files.filter(file => file.startsWith('test-unsupported') && file.endsWith('.jpg'));

      expect(jpegFiles.length).toBe(1);
    });
  });

  describe('poppler.convert() - Options Handling', () => {
    it('should use default values when options are not provided', async () => {
      const minimalOptions = {
        out_dir: testOutputDir,
        out_prefix: 'test-defaults'
      };

      await poppler.convert(samplePdfPath, minimalOptions as any);

      // Should create JPEG files (default format)
      const files = fs.readdirSync(testOutputDir);
      const jpegFiles = files.filter(file => file.startsWith('test-defaults') && file.endsWith('.jpg'));

      expect(jpegFiles.length).toBeGreaterThan(0);
    });

    it('should handle missing out_dir by using default', async () => {
      const options = {
        format: 'png',
        out_prefix: 'test-no-dir',
        page: 1
      };

      // Should not throw error
      await expect(poppler.convert(samplePdfPath, options as any)).resolves.not.toThrow();
    });

    it('should handle numeric page values correctly', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-numeric-page',
        page: '1' as any // String that should be parsed as number
      };

      await poppler.convert(samplePdfPath, options);

      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file => file.startsWith('test-numeric-page') && file.endsWith('.png'));

      expect(pngFiles.length).toBe(1);
    });
  });

  describe('poppler.convert() - Error Handling', () => {
    it('should handle non-existent PDF file', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-error',
        page: 1
      };

      const nonExistentPath = path.join(__dirname, 'non-existent.pdf');

      await expect(poppler.convert(nonExistentPath, options)).rejects.toThrow();
    });

    it('should handle invalid PDF file', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-invalid',
        page: 1
      };

      const textFilePath = path.join(__dirname, '..', 'package.json');

      await expect(poppler.convert(textFilePath, options)).rejects.toThrow();
    });

    it('should handle invalid output directory gracefully', async () => {
      const options = {
        format: 'png',
        out_dir: '/invalid/directory/path',
        out_prefix: 'test-invalid-dir',
        page: 1
      };

      await expect(poppler.convert(samplePdfPath, options)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-error',
        page: 1
      };

      try {
        await poppler.convert('non-existent-file.pdf', options);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeDefined();
        expect(typeof (error as Error).message).toBe('string');
      }
    });
  });

  describe('poppler.convert() - File Output Verification', () => {
    it('should create files with correct naming pattern', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-naming',
        page: null
      };

      await poppler.convert(samplePdfPath, options);

      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file => file.startsWith('test-naming') && file.endsWith('.png'));

      // Verify naming pattern: prefix-pageNumber.extension
      pngFiles.forEach(file => {
        expect(file).toMatch(/^test-naming-\d+\.png$/);
      });
    });

    it('should handle special characters in output prefix', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-special_chars-123',
        page: 1
      };

      await poppler.convert(samplePdfPath, options);

      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file => file.startsWith('test-special_chars-123') && file.endsWith('.png'));

      expect(pngFiles.length).toBe(1);
    });

    it('should verify file integrity by checking file headers', async () => {
      const options = {
        format: 'png',
        out_dir: testOutputDir,
        out_prefix: 'test-integrity',
        page: 1
      };

      await poppler.convert(samplePdfPath, options);

      const files = fs.readdirSync(testOutputDir);
      const pngFiles = files.filter(file => file.startsWith('test-integrity') && file.endsWith('.png'));

      expect(pngFiles.length).toBe(1);

      // Check PNG header
      const pngPath = path.join(testOutputDir, pngFiles[0]);
      const buffer = fs.readFileSync(pngPath);

      // PNG files start with specific magic bytes
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4E); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
    });
  });
});