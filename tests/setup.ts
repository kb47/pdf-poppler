import * as fs from 'fs';
import * as path from 'path';

// Global test setup
beforeAll(() => {
  // Ensure sample.pdf exists for tests
  const samplePdfPath = path.join(__dirname, '..', 'sample.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    throw new Error('sample.pdf is required for tests but was not found in the root directory');
  }

  // Create test output directory if it doesn't exist
  const testOutputDir = path.join(__dirname, '..', 'test-output');
  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
  }
});

// Clean up test files after each test
afterEach(() => {
  // Clean up generated test files
  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);

  files.forEach(file => {
    // Remove test-generated image files
    if (file.startsWith('test-') && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
      try {
        fs.unlinkSync(path.join(rootDir, file));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  // Clean test-output directory
  const testOutputDir = path.join(rootDir, 'test-output');
  if (fs.existsSync(testOutputDir)) {
    const outputFiles = fs.readdirSync(testOutputDir);
    outputFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(testOutputDir, file));
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  }
});