# Enabling speakerstats prosody module

To enable the speaker stats we need to enable speakerstats module under the main
virtual host, this is to enable the advertising the speaker stats component, 
which address needs to be specified in `speakerstats_component` option.

We need to also enable the component with the address specified in `speakerstats_component`.
The component needs also to have the option with the muc component address in
`muc_component` option.

```lua
VirtualHost "jitsi.example.com"
    speakerstats_component = "speakerstats.jitsi.example.com"
    modules_enabled = {
        "speakerstats";
    }

Component "speakerstats.jitsi.example.com" "speakerstats_component"
    muc_component = "conference.jitsi.example.com"

Component "conference.jitsi.example.com" "muc"
```
