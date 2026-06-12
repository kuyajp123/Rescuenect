const { execSync } = require('child_process');

const currentBranch =
  process.env.GITHUB_REF_NAME ||
  process.env.BRANCH_NAME ||
  (() => {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  })();

const mainReleaseAssetPlugins =
  currentBranch === 'main'
    ? [
        [
          '@semantic-release/changelog',
          {
            changelogFile: 'CHANGELOG.md',
          },
        ],
        [
          '@semantic-release/exec',
          {
            prepareCmd: 'node scripts/sync-release-version.cjs ${nextRelease.version}',
          },
        ],
        [
          '@semantic-release/git',
          {
            assets: [
              'CHANGELOG.md',
              'Frontend/package.json',
              'Frontend/package-lock.json',
              'mobile/client/package.json',
              'mobile/client/package-lock.json',
            ],
            message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
          },
        ],
      ]
    : [];

module.exports = {
  branches: [
    'main',
    {
      name: 'staging',
      channel: 'staging',
      prerelease: 'staging',
    },
  ],
  tagFormat: 'v${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'build', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'docs', release: false },
          { type: 'refactor', release: false },
          { type: 'style', release: false },
          { type: 'test', release: false },
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      },
    ],
    ...mainReleaseAssetPlugins,
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
      },
    ],
  ],
};
