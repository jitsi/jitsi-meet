name: '🔀 Gemini Triage'

on:
  workflow_call:
    inputs:
      additional_context:
        type: 'string'
        description: 'Any additional context from the request'
        required: false

concurrency:
  group: '${{ github.workflow }}-triage-${{ github.event_name }}-${{ github.event.pull_request.number || github.event.issue.number }}'
  cancel-in-progress: true

defaults:
  run:
    shell: 'bash'

jobs:
  triage:
    runs-on: 'ubuntu-latest'
    timeout-minutes: 7
    outputs:
      available_labels: '${{ steps.get_labels.outputs.available_labels }}'
      selected_labels: '${{ env.SELECTED_LABELS }}'
    permissions:
      contents: 'read'
      id-token: 'write'
      issues: 'read'
      pull-requests: 'read'
    steps:
      - name: 'Get repository labels'
        id: 'get_labels'
        uses: 'actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd' # ratchet:actions/github-script@v8.0.0
        with:
          # NOTE: we intentionally do not use the given token. The default
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

      - name: 'Run Gemini issue analysis'
        id: 'gemini_analysis'
        if: |-
          ${{ steps.get_labels.outputs.available_labels != '' }}
        uses: 'google-github-actions/run-gemini-cli@v0' # ratchet:exclude
        env:
          GITHUB_TOKEN: '' # Do NOT pass any auth tokens here since this runs on untrusted inputs
          ISSUE_TITLE: '${{ github.event.issue.title }}'
          ISSUE_BODY: '${{ github.event.issue.body }}'
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
          workflow_name: 'gemini-triage'
          # Explicitly set the issue number to handle `issue_comment` triggers where the context might be ambiguous
          github_issue_number: '${{ github.event.issue.number }}'
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
                  "run_shell_command(echo)"
                ]
              }
            }
          prompt: '/gemini-triage'

  label:
    runs-on: 'ubuntu-latest'
    needs:
      - 'triage'
    if: |-
      ${{ needs.triage.outputs.selected_labels != '' }}
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
          ISSUE_NUMBER: '${{ github.event.issue.number }}'
          AVAILABLE_LABELS: '${{ needs.triage.outputs.available_labels }}'
          SELECTED_LABELS: '${{ needs.triage.outputs.selected_labels }}'
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

            // Parse the label as a CSV, reject invalid ones - we do this just
            // in case someone was able to prompt inject malicious labels.
            const selectedLabels = (process.env.SELECTED_LABELS || '').split(',')
              .map((label) => label.trim())
              .filter((label) => availableLabels.includes(label))
              .sort()

            // Set the labels
            const issueNumber = process.env.ISSUE_NUMBER;
            if (selectedLabels && selectedLabels.length > 0) {
              await github.rest.issues.setLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                labels: selectedLabels,
              });
              core.info(`Successfully set labels: ${selectedLabels.join(',')}`);
            } else {
              core.info(`Failed to determine labels to set. There may not be enough information in the issue or pull request.`)
            }
