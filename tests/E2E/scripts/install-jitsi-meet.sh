#!/usr/bin/env bash

# Provision an anonymous, isolated Jitsi instance without a browser or cloud credentials.
set -euo pipefail
umask 077

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
SOURCE_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
RUNTIME_DIR=${JITSI_E2E_RUNTIME_DIR:-"$SOURCE_ROOT/tests/E2E/.runtime"}
RELEASE=${JITSI_E2E_RELEASE:-stable-11248-3}
PROJECT=${JITSI_E2E_PROJECT:-jitsi-e2e}
HTTP_PORT=${JITSI_E2E_HTTP_PORT:-18080}
HTTPS_PORT=${JITSI_E2E_HTTPS_PORT:-18443}
MEDIA_PORT=${JITSI_E2E_MEDIA_PORT:-11000}
PUBLIC_URL=${JITSI_E2E_PUBLIC_URL:-"https://localhost:$HTTPS_PORT"}
ADVERTISE_IP=${JITSI_E2E_ADVERTISE_IP:-127.0.0.1}
ACTION=${1:-install}

[[ "$RELEASE" =~ ^stable-[0-9]+(-[0-9]+)?$ ]] || { echo 'Use a stable Docker release tag.' >&2; exit 2; }
[[ "$PROJECT" =~ ^[a-z0-9][a-z0-9_-]+$ ]] || { echo 'Invalid Compose project name.' >&2; exit 2; }
case "$ACTION" in
    install|restart|reset|status|logs) ;;
    *) echo 'Usage: install-jitsi-meet.sh [install|restart|reset|status|logs]' >&2; exit 2 ;;
esac
for tool in curl docker flock git openssl python3 tar; do
    command -v "$tool" >/dev/null || { echo "Missing $tool" >&2; exit 2; }
done
mkdir -p "$RUNTIME_DIR"
RUNTIME_DIR=$(cd "$RUNTIME_DIR" && pwd)
exec 9> "$RUNTIME_DIR/.install.lock"
flock -n 9 || { echo 'Another installer command is using this runtime directory.' >&2; exit 2; }
RELEASE_DIR="$RUNTIME_DIR/$RELEASE"
ENV_FILE="$RUNTIME_DIR/.env"
OVERRIDE="$RUNTIME_DIR/compose.e2e.yml"
compose() {
    docker compose --project-name "$PROJECT" --env-file "$ENV_FILE" \
        -f "$RELEASE_DIR/docker-compose.yml" -f "$OVERRIDE" "$@"
}
load_config() {
    CONFIG_DIR=$(sed -n 's/^CONFIG=//p' "$ENV_FILE")
    HTTP_PORT=$(sed -n 's/^HTTP_PORT=//p' "$ENV_FILE")
    HTTPS_PORT=$(sed -n 's/^HTTPS_PORT=//p' "$ENV_FILE")
    MEDIA_PORT=$(sed -n 's/^JVB_PORT=//p' "$ENV_FILE")
    PUBLIC_URL=$(sed -n 's/^PUBLIC_URL=//p' "$ENV_FILE")
    SAVED_RELEASE=$(sed -n 's/^JITSI_IMAGE_VERSION=//p' "$ENV_FILE")
    [[ "$SAVED_RELEASE" == "$RELEASE" ]] || { echo 'Use a new runtime directory for a different release.' >&2; exit 2; }
}

wait_ready() {
    local attempt
    for attempt in $(seq 1 90); do
        # The home page alone can load while XMPP is still unavailable.
        if curl --insecure --fail --silent --max-time 5 "$PUBLIC_URL/" -o "$RUNTIME_DIR/home.html" \
            && curl --insecure --fail --silent --max-time 5 "$PUBLIC_URL/config.js" -o "$RUNTIME_DIR/config.js"; then
            curl --insecure --fail --silent "$PUBLIC_URL/source-revision.txt" > "$RUNTIME_DIR/served-revision.txt"
            cmp "$RUNTIME_DIR/expected-revision.txt" "$RUNTIME_DIR/served-revision.txt"
            if python3 "$SCRIPT_DIR/probe-jitsi-meet.py" --url "$PUBLIC_URL" --insecure \
                > "$RUNTIME_DIR/signaling.json"; then
                printf 'Ready: %s (source %s)\n' "$PUBLIC_URL" "$(cat "$RUNTIME_DIR/served-revision.txt")"
                cat "$RUNTIME_DIR/signaling.json"
                return
            fi
        fi
        sleep 2
    done
    echo 'Jitsi did not become HTTP/XMPP ready.' >&2
    compose ps
    compose logs --tail 60
    return 1
}

if [[ "$ACTION" != install ]]; then
    [[ -f "$ENV_FILE" && -f "$OVERRIDE" ]] || { echo 'Install this instance first.' >&2; exit 2; }
    load_config
    case "$ACTION" in
        status) compose ps ;;
        logs) compose logs --tail 100 ;;
        restart) compose restart; wait_ready ;;
        # No volumes or configuration are deleted. Leaving all rooms resets transient meeting state.
        reset) compose down; compose up -d --no-build; wait_ready ;;
    esac
    exit
fi

docker info >/dev/null
if [[ ! -f "$RELEASE_DIR/docker-compose.yml" ]]; then
    mkdir -p "$RELEASE_DIR"
    curl --fail --location --retry 3 "https://github.com/jitsi/docker-jitsi-meet/archive/refs/tags/$RELEASE.tar.gz" \
        -o "$RUNTIME_DIR/$RELEASE.tar.gz"
    tar -xzf "$RUNTIME_DIR/$RELEASE.tar.gz" --strip-components=1 -C "$RELEASE_DIR"
fi

SOURCE_COMMIT=$(git -C "$SOURCE_ROOT" rev-parse HEAD)
SOURCE_DIR="$RUNTIME_DIR/source-$SOURCE_COMMIT"
if [[ ! -f "$SOURCE_DIR/.snapshot-complete" ]]; then
    mkdir -p "$SOURCE_DIR"
    # Build an exact committed snapshot, not this workstation's generated files or untracked drafts.
    git -C "$SOURCE_ROOT" archive "$SOURCE_COMMIT" | tar -xf - -C "$SOURCE_DIR"
    touch "$SOURCE_DIR/.snapshot-complete"
fi
if [[ ! -f "$ENV_FILE" ]]; then
    CONFIG_DIR="$RUNTIME_DIR/config"
    cat > "$ENV_FILE" <<EOF
CONFIG=$CONFIG_DIR
HTTP_PORT=$HTTP_PORT
HTTPS_PORT=$HTTPS_PORT
PUBLIC_URL=$PUBLIC_URL
JVB_PORT=$MEDIA_PORT
JVB_ADVERTISE_IPS=$ADVERTISE_IP
JITSI_IMAGE_VERSION=$RELEASE
TZ=UTC
ENABLE_AUTH=0
ENABLE_GUESTS=0
ENABLE_WELCOME_PAGE=1
ENABLE_PREJOIN_PAGE=1
ENABLE_REQUIRE_DISPLAY_NAME=1
ENABLE_CLOSE_PAGE=0
ENABLE_P2P=0
ENABLE_LETSENCRYPT=0
ENABLE_JAAS_COMPONENTS=0
ENABLE_XMPP_WEBSOCKET=1
ENABLE_THIRD_PARTY_REQUESTS=0
DEFAULT_LANGUAGE=en
JICOFO_MAX_MEMORY=512m
VIDEOBRIDGE_MAX_MEMORY=512m
JICOFO_AUTH_PASSWORD=$(openssl rand -hex 24)
JVB_AUTH_PASSWORD=$(openssl rand -hex 24)
EOF
fi
# Existing configuration and service passwords survive install/restart/reset.
load_config
for path in web web/custom-ca prosody/config prosody/prosody-plugins-custom jicofo jvb \
    storage/prosody storage/web storage/transcripts tmp/web-crontabs tmp/web-load-test; do
    mkdir -p "$CONFIG_DIR/$path"
done
chmod 755 "$CONFIG_DIR" "$CONFIG_DIR/web" "$CONFIG_DIR/prosody" "$CONFIG_DIR/tmp" "$CONFIG_DIR/storage"
# Docker may create root-owned custom-ca directories; only adjust files owned by this installer user.
find "$CONFIG_DIR" -user "$(id -un)" -exec chmod a+rX {} +
chmod 777 "$CONFIG_DIR/storage/"{prosody,web,transcripts} "$CONFIG_DIR/tmp/"{web-crontabs,web-load-test}

cat > "$OVERRIDE" <<EOF
services:
    web:
        image: jitsi-e2e-web:$SOURCE_COMMIT
        ports: !override
            - "127.0.0.1:$HTTP_PORT:8000"
            - "127.0.0.1:$HTTPS_PORT:8443"
    jvb:
        ports: !override
            - "127.0.0.1:$MEDIA_PORT:$MEDIA_PORT/udp"
    jicofo:
        ports: !override []
EOF
docker build --progress plain --build-arg "SOURCE_COMMIT=$SOURCE_COMMIT" \
    --build-arg "JITSI_IMAGE_VERSION=$RELEASE" -t "jitsi-e2e-web:$SOURCE_COMMIT" \
    -f "$SCRIPT_DIR/../docker/Dockerfile" "$SOURCE_DIR"
printf '%s\n' "$SOURCE_COMMIT" > "$RUNTIME_DIR/expected-revision.txt"
compose up -d --no-build
wait_ready
compose ps
