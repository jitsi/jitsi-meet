name: '📋 Gemini Scheduled Issue Triage'

on:
  schedule:
    - cron: '0 * * * *' # Runs every hour
  pull_request:
    branches:
      - 'main'
      - 'release/**/*'
    paths:
      - '.github/workflows/gemini-scheduled-triage.yml'
  push:
    branches:
      - 'main'
      - 'release/**/*'
    paths:
      - '.github/workflows/gemini-scheduled-triage.yml'
  workflow_dispatch:

concurrency:
  group: '${{ github.workflow }}'
  cancel-in-progress: true

defaults:
  run:
    shell: 'bash'

jobs:
  triage:
    runs-on: 'ubuntu-latest'
    timeout-minutes: 7
    permissions:
      contents: 'read'
      id-token: 'write'
      issues: 'read'
      pull-requests: 'read'
    outputs:
      available_labels: '${{ steps.get_labels.outputs.available_labels }}'
      triaged_issues: '${{ env.TRIAGED_ISSUES }}'
    steps:
      - name: 'Get repository labels'
        id: 'get_labels'
        uses: 'actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd' # ratchet:actions/github-script@v8.0.0
        with:
          # NOTE: we intentionally do not use the minted token. The default
          # GITHUB_TOKEN provided by the action has enough permissions to read
          # the labels.
          script: |-
            const labels = [];
            for await (const response of github.paginate.iterator(github.rest.issues.listLabelsForRepo, {
              owner: context.repo.owner,
              repo: context.repo.repo,
              per_page: 100, // Maximum per page to reduce API calls
            })) {
              labels.push(...response.data);
            }

            if (!labels || labels.length === 0) {
              core.setFailed('There are no issue labels in this repository.')
            }

            const labelNames = labels.map(label => label.name).sort();
            core.setOutput('available_labels', labelNames.join(','));
            core.info(`Found ${labelNames.length} labels: ${labelNames.join(', ')}`);
            return labelNames;

      - name: 'Find untriaged issues'
        id: 'find_issues'
        env:
          GITHUB_REPOSITORY: '${{ github.repository }}'
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN || github.token }}'
        run: |-
          echo '🔍 Finding unlabeled issues and issues marked for triage...'
          ISSUES="$(gh issue list \
            --state 'open' \
            --search 'no:label label:"status/needs-triage"' \
            --json number,title,body \
            --limit '100' \
            --repo "${GITHUB_REPOSITORY}"
          )"

          echo '📝 Setting output for GitHub Actions...'
          echo "issues_to_triage=${ISSUES}" >> "${GITHUB_OUTPUT}"

          ISSUE_NUMBERS="$(echo "${ISSUES}" | jq -r '.[].number | tostring' | paste -sd, -)"
          echo "issue_numbers=${ISSUE_NUMBERS}" >> "${GITHUB_OUTPUT}"

          ISSUE_COUNT="$(echo "${ISSUES}" | jq 'length')"
          echo "✅ Found ${ISSUE_COUNT} issue(s) to triage! 🎯"

      - name: 'Run Gemini Issue Analysis'
        id: 'gemini_issue_analysis'
        if: |-
          ${{ steps.find_issues.outputs.issues_to_triage != '[]' }}
        uses: 'google-github-actions/run-gemini-cli@v0' # ratchet:exclude
        env:
          GITHUB_TOKEN: '' # Do not pass any auth token here since this runs on untrusted inputs
          ISSUES_TO_TRIAGE: '${{ steps.find_issues.outputs.issues_to_triage }}'
          REPOSITORY: '${{ github.repository }}'
          AVAILABLE_LABELS: '${{ steps.get_labels.outputs.available_labels }}'
        with:
          gcp_location: '${{ vars.GOOGLE_CLOUD_LOCATION }}'
          gcp_project_id: '${{ vars.GOOGLE_CLOUD_PROJECT }}'
          gcp_service_account: '${{ vars.SERVICE_ACCOUNT_EMAIL }}'
          gcp_workload_identity_provider: '${{ vars.GCP_WIF_PROVIDER }}'
          gemini_api_key: '${{ secrets.GEMINI_API_KEY }}'
          gemini_cli_version: '${{ vars.GEMINI_CLI_VERSION }}'
          gemini_debug: '${{ fromJSON(vars.GEMINI_DEBUG || vars.ACTIONS_STEP_DEBUG || false) }}'
          gemini_model: '${{ vars.GEMINI_MODEL }}'
          google_api_key: '${{ secrets.GOOGLE_API_KEY }}'
          use_gemini_code_assist: '${{ vars.GOOGLE_GENAI_USE_GCA }}'
          use_vertex_ai: '${{ vars.GOOGLE_GENAI_USE_VERTEXAI }}'
          upload_artifacts: '${{ vars.UPLOAD_ARTIFACTS }}'
          workflow_name: 'gemini-scheduled-triage'
          # Overriding default telemetry inputs because scheduled workflows lack an event payload
          # We pass the dynamically generated list of batch issues to the issue number field
          github_issue_number: '${{ steps.find_issues.outputs.issue_numbers }}'
          settings: |-
            {
              "model": {
                "maxSessionTurns": 25
              },
              "telemetry": {
                "enabled": true,
                "target": "local",
                "outfile": ".gemini/telemetry.log"
              },
              "tools": {
                "core": [
                  "run_shell_command(echo)",
                  "run_shell_command(jq)",
                  "run_shell_command(printenv)"
                ]
              }
            }
          prompt: '/gemini-scheduled-triage'

  label:
    runs-on: 'ubuntu-latest'
    needs:
      - 'triage'
    if: |-
      needs.triage.outputs.available_labels != '' &&
      needs.triage.outputs.available_labels != '[]' &&
      needs.triage.outputs.triaged_issues != '' &&
      needs.triage.outputs.triaged_issues != '[]'
    permissions:
      contents: 'read'
      issues: 'write'
      pull-requests: 'write'
    steps:
      - name: 'Mint identity token'
        id: 'mint_identity_token'
        if: |-
          ${{ vars.APP_ID }}
        uses: 'actions/create-github-app-token@29824e69f54612133e76f7eaac726eef6c875baf' # ratchet:actions/create-github-app-token@v2
        with:
          app-id: '${{ vars.APP_ID }}'
          private-key: '${{ secrets.APP_PRIVATE_KEY }}'
          permission-contents: 'read'
          permission-issues: 'write'
          permission-pull-requests: 'write'

      - name: 'Apply labels'
        env:
          AVAILABLE_LABELS: '${{ needs.triage.outputs.available_labels }}'
          TRIAGED_ISSUES: '${{ needs.triage.outputs.triaged_issues }}'
        uses: 'actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd' # ratchet:actions/github-script@v8.0.0
        with:
          # Use the provided token so that the "gemini-cli" is the actor in the
          # log for what changed the labels.
          github-token: '${{ steps.mint_identity_token.outputs.token || secrets.GITHUB_TOKEN || github.token }}'
          script: |-
            // Parse the available labels
            const availableLabels = (process.env.AVAILABLE_LABELS || '').split(',')
              .map((label) => label.trim())
              .sort()

            // Parse out the triaged issues
            const triagedIssues = (JSON.parse(process.env.TRIAGED_ISSUES || '{}'))
              .sort((a, b) => a.issue_number - b.issue_number)

            core.debug(`Triaged issues: ${JSON.stringify(triagedIssues)}`);

            // Iterate over each label
            for (const issue of triagedIssues) {
              if (!issue) {
                core.debug(`Skipping empty issue: ${JSON.stringify(issue)}`);
                continue;
              }

              const issueNumber = issue.issue_number;
              if (!issueNumber) {
                core.debug(`Skipping issue with no data: ${JSON.stringify(issue)}`);
                continue;
              }

              // Extract and reject invalid labels - we do this just in case
              // someone was able to prompt inject malicious labels.
              let labelsToSet = (issue.labels_to_set || [])
                .map((label) => label.trim())
                .filter((label) => availableLabels.includes(label))
                .sort()

              core.debug(`Identified labels to set: ${JSON.stringify(labelsToSet)}`);

              if (labelsToSet.length === 0) {
                core.info(`Skipping issue #${issueNumber} - no labels to set.`)
                continue;
              }

              core.debug(`Setting labels on issue #${issueNumber} to ${labelsToSet.join(', ')} (${issue.explanation || 'no explanation'})`)

              await github.rest.issues.setLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                labels: labelsToSet,
              });
            }
