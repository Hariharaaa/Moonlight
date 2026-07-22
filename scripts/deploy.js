const { spawnSync } = require('child_process');
const path = require('path');

// Extract arguments, e.g. --network preview
const args = process.argv.slice(2);

console.log('Deploying Counter Contract to Midnight Network...');

// Call the deployment script inside the mn-demo scaffolded project,
// because it contains all the Midnight SDK networking and wallet logic.
const result = spawnSync('npm', ['run', 'deploy:counter', '--', ...args], {
  cwd: path.join(__dirname, '..', 'mn-demo'),
  stdio: 'inherit',
  shell: true,
});

if (result.error) {
  console.error('Failed to run deployment:', result.error);
  process.exit(1);
}

process.exit(result.status);
