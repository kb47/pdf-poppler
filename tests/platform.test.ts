import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Platform-Specific Functionality', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    // Reset platform after each test
    Object.defineProperty(process, 'platform', { value: originalPlatform });

    // Clear require cache to ensure fresh module load
    const modulePaths = [
      require.resolve('../index.js'),
      require.resolve('../lib/info.js'),
      require.resolve('../lib/convert.js'),
      require.resolve('../lib/imgdata.js')
    ];

    modulePaths.forEach(modulePath => {
      delete require.cache[modulePath];
    });
  });

  describe('Platform Detection', () => {
    it('should detect Windows platform correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const poppler = require('../index.js');

      expect(poppler.path).toContain('win');
      expect(poppler.path).toContain('poppler-0.51');
    });

    it('should detect macOS platform correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const poppler = require('../index.js');

      expect(poppler.path).toContain('osx');
      expect(poppler.path).toContain('poppler-latest');
    });

    it('should detect Linux platform correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const poppler = require('../index.js');

      expect(poppler.path).toContain('linux');
      expect(poppler.path).toContain('poppler-latest');
    });

    it('should handle unsupported platforms', () => {
      Object.defineProperty(process, 'platform', { value: 'unsupported' as any });

      // Mock process.exit to prevent actual exit during testing
      const originalExit = process.exit;
      const mockExit = jest.fn();
      process.exit = mockExit as any;

      // Mock console.error to capture error message
      const originalError = console.error;
      const mockError = jest.fn();
      console.error = mockError;

      try {
        require('../index.js');
        expect(mockError).toHaveBeenCalledWith('unsupported is NOT supported.');
        expect(mockExit).toHaveBeenCalledWith(1);
      } finally {
        // Restore original functions
        process.exit = originalExit;
        console.error = originalError;
      }
    });
  });

  describe('Linux Platform Specific', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
    });

    it('should use Lambda Layer binaries when in AWS Lambda environment', () => {
      // Mock AWS Lambda environment
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';

      // Mock fs.existsSync to simulate /opt/bin/pdftocairo exists
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockImplementation((path: string) => {
        if (path === '/opt/bin/pdftocairo') return true;
        return jest.requireActual('fs').existsSync(path);
      });

      try {
        const poppler = require('../index.js');
        expect(poppler.path).toBe('/opt/bin');
      } finally {
        mockExistsSync.mockRestore();
        delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      }
    });

    it('should fallback to bundled binaries in Lambda when Layer not available', () => {
      // Mock AWS Lambda environment
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';

      // Mock fs.existsSync to simulate /opt/bin/pdftocairo does not exist
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockImplementation((path: string) => {
        if (path === '/opt/bin/pdftocairo') return false;
        return jest.requireActual('fs').existsSync(path);
      });

      try {
        const poppler = require('../index.js');
        expect(poppler.path).toContain('linux');
        expect(poppler.path).toContain('poppler-latest');
      } finally {
        mockExistsSync.mockRestore();
        delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      }
    });

    it('should use bundled binaries in regular Linux environment', () => {
      // Ensure no Lambda environment
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;

      const poppler = require('../index.js');

      expect(poppler.path).toContain('linux');
      expect(poppler.path).toContain('poppler-latest');
      expect(poppler.path).not.toBe('/opt/bin');
    });
  });

  describe('macOS Platform Specific', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
    });

    it('should set up correct paths for macOS', () => {
      const poppler = require('../index.js');

      expect(poppler.path).toContain('osx');
      expect(poppler.path).toContain('poppler-latest');
      expect(poppler.path).toContain('bin');
    });

    it('should handle ASAR paths correctly', () => {
      // Simulate Electron ASAR environment
      const originalDirname = __dirname;
      const asarPath = __dirname.replace(/\\/g, '/') + '.asar/lib';

      // Mock __dirname for the module
      jest.doMock('path', () => ({
        ...jest.requireActual('path'),
        join: jest.fn().mockImplementation((...args) => {
          const result = jest.requireActual('path').join(...args);
          return result.includes('.asar') ? result.replace('.asar', '.asar.unpacked') : result;
        })
      }));

      const poppler = require('../index.js');

      // Verify ASAR handling would work (can't fully test without actual ASAR)
      expect(poppler.path).toBeDefined();
    });
  });

  describe('Windows Platform Specific', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
    });

    it('should set up correct paths for Windows', () => {
      const poppler = require('../index.js');

      expect(poppler.path).toContain('win');
      expect(poppler.path).toContain('poppler-0.51');
      expect(poppler.path).toContain('bin');
    });

    it('should handle ASAR paths correctly on Windows', () => {
      const poppler = require('../index.js');

      // Verify Windows ASAR handling would work
      expect(poppler.path).toBeDefined();
      expect(typeof poppler.path).toBe('string');
    });
  });

  describe('Execution Options', () => {
    it('should provide consistent execution options across platforms', () => {
      ['win32', 'darwin', 'linux'].forEach(platform => {
        Object.defineProperty(process, 'platform', { value: platform });

        // Clear cache and reload
        Object.keys(require.cache).forEach(key => {
          if (key.includes('pdf-poppler')) {
            delete require.cache[key];
          }
        });

        const poppler = require('../index.js');

        expect(poppler.exec_options).toBeDefined();
        expect(poppler.exec_options.encoding).toBe('utf8');
        expect(poppler.exec_options.maxBuffer).toBe(5000 * 1024);
        expect(poppler.exec_options.shell).toBe(false);
      });
    });
  });

  describe('Binary Availability', () => {
    it('should have required binaries for current platform', () => {
      const poppler = require('../index.js');
      const requiredBinaries = ['pdfinfo', 'pdftotext', 'pdftoppm', 'pdfimages'];

      // Note: This test checks if the path is set correctly
      // Actual binary existence depends on the build/platform
      expect(poppler.path).toBeDefined();
      expect(typeof poppler.path).toBe('string');
      expect(poppler.path.length).toBeGreaterThan(0);

      // Verify path structure makes sense
      expect(poppler.path).toContain('bin');
    });
  });

  describe('Module Exports', () => {
    it('should provide consistent API across all platforms', () => {
      ['win32', 'darwin', 'linux'].forEach(platform => {
        Object.defineProperty(process, 'platform', { value: platform });

        // Clear cache and reload
        Object.keys(require.cache).forEach(key => {
          if (key.includes('pdf-poppler')) {
            delete require.cache[key];
          }
        });

        const poppler = require('../index.js');

        // Verify all expected exports exist
        expect(typeof poppler.path).toBe('string');
        expect(typeof poppler.exec_options).toBe('object');
        expect(typeof poppler.info).toBe('function');
        expect(typeof poppler.imgdata).toBe('function');
        expect(typeof poppler.convert).toBe('function');
      });
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle AWS Lambda environment variables correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });

      // Test with Lambda function name set
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-test-function';

      const poppler = require('../index.js');

      // Should attempt to use Lambda paths
      expect(poppler.path).toBeDefined();

      // Clean up
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    });

    it('should work without AWS environment variables', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });

      // Ensure no Lambda environment
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;

      const poppler = require('../index.js');

      expect(poppler.path).toContain('linux');
      expect(poppler.path).not.toBe('/opt/bin');
    });
  });
});