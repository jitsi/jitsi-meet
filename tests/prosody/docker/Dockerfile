# Prosody 0.13+ with Jitsi plugins for integration testing.

# Builder stage: compile/install Lua libraries that aren't available as apt
# packages for Lua 5.4 in the prosodyim base image.
FROM prosodyim/prosody:13.0 AS builder

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        liblua5.4-dev \
    && luarocks --lua-version 5.4 install basexx \
    && rm -rf /var/lib/apt/lists/*

# Final image
FROM prosodyim/prosody:13.0

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        lua-cjson \
        lua-inspect \
        lua-luaossl \
    && mv /usr/share/lua/5.3/inspect.lua /usr/share/lua/5.4/ \
    && rm -rf /var/lib/apt/lists/*

# Copy luarocks-installed pure-Lua libs from builder.
COPY --from=builder /usr/local/share/lua/5.4 /usr/local/share/lua/5.4

# Copy all plugins into a dedicated path (added to plugin_paths in the config).
# The tests/ directory is also copied but Prosody only loads explicitly named modules.
COPY --chown=prosody:prosody resources/prosody-plugins/ /opt/prosody-jitsi-plugins/

# inspect.lua is required by several Jitsi plugins for debug logging.
# Provide a minimal stub so those modules load without needing luarocks.
COPY --chown=prosody:prosody tests/prosody/docker/inspect.lua /opt/prosody-jitsi-plugins/inspect.lua

COPY --chown=prosody:prosody tests/prosody/docker/prosody.cfg.lua /etc/prosody/prosody.cfg.lua

# Test ASAP public keys — served by mod_test_observer_http for RS256 token verification tests.
# Two separate key pairs are used: one for login tokens (mod_auth_token) and one for system
# tokens (mod_muc_end_meeting and similar HTTP API modules).
COPY --chown=prosody:prosody tests/prosody/fixtures/test-asap-public.pem /opt/prosody-jitsi-plugins/test-asap-public.pem
COPY --chown=prosody:prosody tests/prosody/fixtures/test-system-asap-public.pem /opt/prosody-jitsi-plugins/test-system-asap-public.pem

# Pre-create the focus admin account (focus@auth.localhost, password "focussecret").
# prosodyctl register writes properly hashed credentials (SCRAM-SHA-*) directly
# to the data directory without requiring a running Prosody instance — it just
# reads the config for data_path and the VirtualHost definition.
RUN prosodyctl register focus auth.localhost focussecret \
    && chown -R prosody:prosody /var/lib/prosody
