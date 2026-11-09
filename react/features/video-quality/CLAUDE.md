# video-quality

## Receive quality in tile view

- The rendered tile height sets the receive quality in tile view, not the source resolution. `subscriber.ts` maps the tile height to a level with `getReceiverVideoQualityLevel()` and `videoQuality.minHeightForQualityLvl`. By default each threshold equals its level (for example 360 and 720). A tile under 720px high gets at most 360p, with no warning.
- `maxFullResolutionParticipants` (default 2) caps tile view at 360p when the participant count is over the value, whatever the tile size. To get full resolution for more participants, set it to `-1` (no cap) or to a higher number. It can be set in the URL: `#config.maxFullResolutionParticipants=3`.
