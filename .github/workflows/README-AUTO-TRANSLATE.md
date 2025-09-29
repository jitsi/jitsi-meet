# Auto-Translation Workflow for Bulgarian

This directory contains the automated Bulgarian translation workflow that runs whenever changes are made to `lang/main.json`.

## Overview

The workflow automatically:
1. Detects changes in `lang/main.json` on the master branch
2. Uses Claude Code CLI in headless mode to translate
3. Claude reads both files, identifies missing/modified keys, and generates professional Bulgarian translations
4. Creates a pull request with the updated `lang/main-bg.json`

## Setup

### Prerequisites

1. **Anthropic API Key**: You need an Anthropic API key with access to Claude models.
2. **GitHub Permissions**: The workflow requires `contents: write` and `pull-requests: write` permissions.

### Configuration Steps

1. **Add Anthropic API Key to GitHub Secrets**:
   - Go to your repository's Settings → Secrets and variables → Actions
   - Add a new secret named `ANTHROPIC_API_KEY`
   - Paste your Anthropic API key as the value

2. **Verify GitHub Token Permissions**:
   - The workflow uses the default `GITHUB_TOKEN`
   - Ensure your repository settings allow GitHub Actions to create pull requests
   - Go to Settings → Actions → General → Workflow permissions
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

### Model Configuration

The workflow uses the default Claude model provided by the Claude Code CLI. To specify a different model, you can add the `--model` flag to the `claude` command in the workflow file.

## How It Works

### Workflow Trigger

The workflow is triggered automatically when:
- A commit is pushed to the `master` branch
- The commit includes changes to `lang/main.json`

### Translation Process

1. **Workflow Triggered**: When changes to `lang/main.json` are pushed to master
2. **Claude Code CLI**: The CLI is invoked in headless mode with the translation prompt
3. **File Reading**: Claude reads both `lang/main.json` and `lang/main-bg.json`
4. **Change Detection**: Claude compares the files to identify missing or different keys
5. **AI Translation**: Claude translates new/modified keys with instructions to:
   - Maintain consistency with existing Bulgarian translations
   - Use professional, natural Bulgarian language
   - Preserve placeholders like `{{variable}}`
   - Follow alphabetical key ordering
   - Avoid mixed Bulgarian/English (except established technical terms)
6. **File Update**: `lang/main-bg.json` is updated with new translations
7. **PR Creation**: A pull request is automatically created for review

### Review Process

After the workflow runs, a PR will be created with:
- Title: `feat(i18n): Auto-update Bulgarian translations`
- Branch name: `auto-translate-bulgarian-YYYYMMDD-HHMMSS`
- Automated checklist for reviewing translation quality

**Important**: Always review the automated translations before merging!

## Files

- `.github/workflows/auto-translate-bulgarian-cli.yml` - GitHub Actions workflow definition using Claude Code CLI
- `.github/workflows/README-AUTO-TRANSLATE.md` - This documentation file

## Testing

To test the workflow:

1. Create a test branch from master
2. Modify `lang/main.json` (add or change a key)
3. Push to master (or create a test workflow that runs on a different branch)
4. Monitor the Actions tab to see the workflow run
5. Review the generated PR

## Troubleshooting

### Workflow Not Triggering

- Verify that changes include `lang/main.json`
- Check that the commit is to the `master` branch
- Review the workflow file syntax

### API Errors

- Verify `ANTHROPIC_API_KEY` is correctly set in repository secrets
- Check API key permissions and quotas
- Review model availability (ensure model ID is correct)

### Translation Quality Issues

- Review the prompt in `.github/workflows/auto-translate-bulgarian-cli.yml`
- Adjust instructions for specific terminology or style requirements
- Consider specifying a different model using the `--model` flag

### No PR Created

- Check that there are actual changes to `lang/main-bg.json`
- Verify GitHub token permissions for creating PRs
- Review workflow logs for errors

## Cost Considerations

- Each workflow run consumes Claude API tokens
- Monitor usage in your Anthropic dashboard
- Typical cost per run depends on number of keys translated

## Extending to Other Languages

To add automation for other languages:

1. Copy `.github/workflows/auto-translate-bulgarian-cli.yml`
2. Rename the file (e.g., `auto-translate-spanish.yml`)
3. Update the workflow:
   - Workflow name
   - Target language file path in `paths` (e.g., `lang/main.json`)
   - Target language in the prompt (e.g., replace "Bulgarian" with "Spanish", and `main-bg.json` with `main-es.json`)
4. Customize translation guidelines for the target language
5. Update PR title and branch name to reflect the new language

## Security Notes

- Never commit API keys to the repository
- Use GitHub Secrets for sensitive data
- Review automated translations before merging to production
- Monitor API usage for unexpected activity

## Support

For issues or questions:
- Check workflow logs in the Actions tab
- Review the research document: `bulgarian-translation-automation-research.md`
- Contact the maintainer for API key or permissions issues