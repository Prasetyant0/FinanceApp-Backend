const { spawn } = require('child_process');

const runTests = () => {
  console.log('🚀 Starting Test Suite...\n');

  const testProcess = spawn('npm', ['test'], {
    stdio: 'inherit',
    shell: true
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Some tests failed!');
      process.exit(1);
    }
  });

  testProcess.on('error', (error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
};

runTests();
