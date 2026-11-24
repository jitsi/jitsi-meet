-- Prosody config for integration testing.
-- Assembled from fragment files so that other environments (e.g. private
-- plugin repos) can extend specific sections without duplicating the entire
-- config.
--
-- Fragment layout:
--   cfg/global.cfg.lua       — global settings (data_path, plugin_paths, modules_enabled, …)
--   cfg/virtualhosts.cfg.lua — all VirtualHost blocks
--   cfg/components.cfg.lua   — all Component blocks except conference.localhost
--   cfg/conference.cfg.lua   — conference.localhost (separate so it can be re-declared)
--
-- An extending image keeps the fragments and replaces this file with one that
-- Includes cfg/global + cfg/virtualhosts + cfg/components, then declares its
-- own conference.localhost block (based on cfg/conference.cfg.lua) with extra
-- modules appended.

Include "/etc/prosody/cfg/global.cfg.lua"
Include "/etc/prosody/cfg/virtualhosts.cfg.lua"
Include "/etc/prosody/cfg/components.cfg.lua"
Include "/etc/prosody/cfg/conference.cfg.lua"
