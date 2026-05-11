name: '🧙 Gemini Plan Execution'

on:
  workflow_call:
    inputs:
      additional_context:
        type: 'string'
        description: 'Any additional context from the request'
        required: false

concurrency:
  group: '${{ github.workflow }}-plan-execute-${{ github.event_name }}-${{ github.event.pull_request.number || github.event.issue.number }}'
  cancel-in-progress: true

defaults:
  run:
    shell: 'bash'

jobs:
  plan-execute:
    timeout-minutes: 30
    runs-on: 'ubuntu-latest'
    permissions:
      contents: 'write'
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
          permission-contents: 'write'
          permission-issues: 'write'
          permission-pull-requests: 'write'

      - name: 'Checkout Code'
        uses: 'actions/checkout@v4' # ratchet:exclude

      - name: 'Run Gemini CLI'
        id: 'run_gemini'
        uses: 'google-github-actions/run-gemini-cli@v0' # ratchet:exclude
        env:
          TITLE: '${{ github.event.pull_request.title || github.event.issue.title }}'
          DESCRIPTION: '${{ github.event.pull_request.body || github.event.issue.body }}'
          EVENT_NAME: '${{ github.event_name }}'
          GITHUB_TOKEN: '${{ steps.mint_identity_token.outputs.token || secrets.GITHUB_TOKEN || github.token }}'
          IS_PULL_REQUEST: '${{ !!github.event.pull_request }}'
          ISSUE_NUMBER: '${{ github.event.pull_request.number || github.event.issue.number }}'
          REPOSITORY: '${{ github.repository }}'
          ADDITIONAL_CONTEXT: '${{ inputs.additional_context }}'
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
          workflow_name: 'gemini-plan-execute'
          # Assistant workflows can be triggered by comments on either Issues or PRs.
          # We explicitly map both fields so the CLI can correctly categorize the interaction.
          github_pr_number: '${{ github.event.pull_request.number }}'
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
                    "add_issue_comment",
                    "issue_read",
                    "list_issues",
                    "search_issues",
                    "create_pull_request",
                    "pull_request_read",
                    "list_pull_requests",
                    "search_pull_requests",
                    "create_branch",
                    "create_or_update_file",
                    "delete_file",
                    "fork_repository",
                    "get_commit",
                    "get_file_contents",
                    "list_commits",
                    "push_files",
                    "search_code"
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
          prompt: '/gemini-plan-execute'
