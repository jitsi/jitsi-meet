--This module performs features checking when a transcription is requested.
--If the transcription feature is not allowed, the tag indicating that a
--transcription is being requested will be stripped from the presence stanza.
--The module must be enabled under the muc component.
local is_feature_allowed = module:require "util".is_feature_allowed;

module:log("info", "Loading mod_muc_transcription_filter!");
local filtered_tag_name = "jitsi_participant_requestingTranscription";

function filter_transcription_tag(event)
    local stanza = event.stanza;
    local session = event.origin;
    if stanza and stanza.name == "presence" then
        if not is_feature_allowed(session.jitsi_meet_context_features,'transcription') then
            stanza:maptags(function(tag)
                if tag and tag.name == filtered_tag_name then
                    module:log("info", "Removing %s tag from presence stanza!", filtered_tag_name);
                    return nil;
                else
                    return tag;
                end
            end)
        end
    end
end

module:hook("presence/bare", filter_transcription_tag);
module:hook("presence/full", filter_transcription_tag);
module:hook("presence/host", filter_transcription_tag);

module:log("info", "Loaded mod_muc_transcription_filter!");
