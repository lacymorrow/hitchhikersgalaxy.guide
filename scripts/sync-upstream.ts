import { execSync } from 'child_process';

// Configuration
const UPSTREAM_REMOTE = 'upstream';
const UPSTREAM_BRANCH = 'main'; // or 'master', depending on your upstream's default branch
const CURRENT_BRANCH = 'main'; // or the branch you want to update

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error executing command: ${command}`);
      console.error((error as { stderr?: string }).stderr || error.message);
    } else {
      console.error(`Unknown error occurred while executing command: ${command}`);
    }
    process.exit(1);
  }
}

function syncUpstream(): void {
  console.log('Syncing from upstream...');

  // Ensure we have the upstream remote
  try {
    runCommand(`git remote get-url ${UPSTREAM_REMOTE}`);
  } catch (error) {
    console.error(`Upstream remote '${UPSTREAM_REMOTE}' not found. Please add it using:`);
    console.error(`git remote add ${UPSTREAM_REMOTE} <upstream_repo_url>`);
    process.exit(1);
  }

  // Fetch the latest changes from upstream
  runCommand(`git fetch ${UPSTREAM_REMOTE}`);

  // Check if we're on the correct branch
  const currentBranch = runCommand('git rev-parse --abbrev-ref HEAD').trim();
  if (currentBranch !== CURRENT_BRANCH) {
    console.error(`Not on ${CURRENT_BRANCH} branch. Please switch to ${CURRENT_BRANCH} before running this script.`);
    process.exit(1);
  }

  // Merge upstream changes
  console.log(`Merging changes from ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}...`);
  runCommand(`git merge ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}`);

  // Update dependencies
  console.log('Updating dependencies...');
  runCommand('npm install');

  console.log('Update from upstream completed successfully.');
}

syncUpstream();
