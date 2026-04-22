# Prosody 0.13+ with Jitsi plugins for integration testing.
# If prosody/prosody:0.13 is not yet published, use prosody/prosody:nightly.
FROM prosodyim/prosody:13.0

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends lua-cjson \
    && rm -rf /var/lib/apt/lists/*

# Copy all plugins into a dedicated path (added to plugin_paths in the config).
# The spec/ directory is also copied but Prosody only loads explicitly named modules.
COPY --chown=prosody:prosody . /opt/prosody-jitsi-plugins/

COPY --chown=prosody:prosody spec/docker/prosody.cfg.lua /etc/prosody/prosody.cfg.lua
