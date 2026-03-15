const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const isWin = os.platform() === 'win32';
const pyPath = isWin 
  ? path.join('backend', '.venv', 'Scripts', 'python.exe') 
  : path.join('backend', '.venv', 'bin', 'python');
const absPyPath = path.resolve(__dirname, pyPath);

if (!fs.existsSync(absPyPath)) {
  console.error(`\x1b[31mError: Python virtual environment not found at ${pyPath}\x1b[0m`);
  console.error("Please follow SETUP.md to create the virtual environment.");
  process.exit(1);
}

const child = spawn(absPyPath, ['manage.py', 'runserver'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error(`\x1b[31mFailed to start backend server: ${err.message}\x1b[0m`);
  process.exit(1);
});

child.on('exit', code => process.exit(code || 0));
