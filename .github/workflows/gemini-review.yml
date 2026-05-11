name: '🔎 Gemini Review'

on:
  workflow_call:
    inputs:
      additional_context:
        type: 'string'
        description: 'Any additional context from the request'
        required: false

concurrency:
  group: '${{ github.workflow }}-review-${{ github.event_name }}-${{ github.event.pull_request.number || github.event.issue.number }}'
  cancel-in-progress: true

defaults:
  run:
    shell: 'bash'

jobs:
  review:
    runs-on: 'ubuntu-latest'
    timeout-minutes: 7
    permissions:
      contents: 'read'
      id-token: 'write'
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

      - name: 'Checkout repository'
        uses: 'actions/checkout@8e8c483db84b4bee98b60c0593521ed34d9990e8' # ratchet:actions/checkout@v6

      - name: 'Run Gemini pull request review'
        uses: 'google-github-actions/run-gemini-cli@v0' # ratchet:exclude
        id: 'gemini_pr_review'
        env:
          GITHUB_TOKEN: '${{ steps.mint_identity_token.outputs.token || secrets.GITHUB_TOKEN || github.token }}'
          ISSUE_TITLE: '${{ github.event.pull_request.title || github.event.issue.title }}'
          ISSUE_BODY: '${{ github.event.pull_request.body || github.event.issue.body }}'
          PULL_REQUEST_NUMBER: '${{ github.event.pull_request.number || github.event.issue.number }}'
          REPOSITORY: '${{ github.repository }}'
          ADDITIONAL_CONTEXT: '${{ inputs.additional_context }}'
          GEMINI_API_KEY: '${{ secrets.GEMINI_API_KEY }}'
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
          workflow_name: 'gemini-review'
          # Explicitly set the PR number to handle `issue_comment` triggers (which GitHub treats as issues, not PRs)
          github_pr_number: '${{ github.event.pull_request.number }}'
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
              "mcpServers": {
                "github": {
                  "command": "docker",
                  "args": [
                    "run",
                    "-i",
                    "--rm",
                    "-e",
                    "GITHUB_PERSONAL_ACCESS_TOKEN",
                    "ghcr.io/github/github-mcp-server:v0.27.0"
                  ],
                  "includeTools": [
                    "add_comment_to_pending_review",
                    "pull_request_read",
                    "pull_request_review_write"
                  ],
                  "env": {
                    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
                  }
                }
              },
              "tools": {
                "core": [
                  "run_shell_command(cat)",
                  "run_shell_command(echo)",
                  "run_shell_command(grep)",
                  "run_shell_command(head)",
                  "run_shell_command(tail)"
                ]
              }
            }
          extensions: |
            [
              "https://github.com/gemini-cli-extensions/code-review"
            ]
          prompt: '/pr-code-review'
