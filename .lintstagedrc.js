const path = require("node:path");

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

// LAC-3470: refuse to commit dotenv files. Allow `.env.example` only.
// Any other `.env*` filename (`.env`, `.env.local`, `.env.production`, ...)
// fails the commit before it lands. Runs when lint-staged is invoked from a
// pre-commit hook.
const rejectEnvFiles = (filenames) => {
  const forbidden = filenames.filter(
    (f) => path.basename(f) !== ".env.example",
  );
  if (forbidden.length === 0) return [];
  const list = forbidden.map((f) => path.relative(process.cwd(), f)).join(", ");
  const msg =
    `Refusing to commit dotenv file(s): ${list}. ` +
    `These are ignored by .gitignore and must never be committed. ` +
    `Move real values into your local .env and commit only .env.example.`;
  return [
    `node -e "console.error(${JSON.stringify(msg)}); process.exit(1)"`,
  ];
};

module.exports = {
  "*.{js,jsx,ts,tsx}": [buildEslintCommand],
  ".env*": rejectEnvFiles,
  "**/.env*": rejectEnvFiles,
};
