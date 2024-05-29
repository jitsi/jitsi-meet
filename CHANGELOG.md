# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.6] - 2024-05-28
### Upgraded
- Modified notification for getting triggered by remote change of the mute status

## [2.0.5] - 2024-05-14
### Upgraded
- Added listener for mute status changed

## [2.0.4] - 2023-09-07
### Upgraded
- Setup test environment for local testing and fixed setRoomBackground

## [2.0.3] - 2023-09-06
### Upgraded
- Add missing functions for set room background

## [2.0.2] - 2023-09-04
### Upgraded
- Add missing functions and commands in external_api and API and fix lint

## [2.0.1] - 2023-09-04
### Upgraded
- Add missing custom function in external_api.js

## [2.0.0] - 2023-09-01
### Upgraded
- Get branch stable/jitsi-meet_8719 and applied the Ivicos changes, to get rid of the issue introduced at the beginning with the linter
- This branch will replace the current master

## [1.1.51] - 2023-06-14
### Changed
- External API endpoint for requesting shared video state from video owner is added
- External API endpoint for fetching the local participant Id is added

## [1.1.50] - 2023-06-06
### Changed
- Video state update notification instead of owner update implemented
- External API endpoints for getting and updating shared video state are added
- Video owner update mechanism changed, video state notification is send on each state update attempt

## [1.1.49] - 2023-05-22
### Changed
- Made the video player play the video directly after starting the video instead of pausing
- Removed Jitsi Watermark from top left corner

## [1.1.47] - 2023-05-12
### Changed
- Endpoint for pausing the shared video is added

## [1.1.46] - 2023-05-05
### Changed
- Bug in getParticipantsInfo endpoint in external api , which causes unreliable results is fixed.

## [1.1.45] - 2023-04-12
### Changed
- Video owner update notification endpoint is extended
- Endpoint for shared video stop notification is implemented

## [1.1.44] - 2023-02-23
### Changed
- Minified external API js files updated in order to resolve the problem with the missing video sharing endpoints on the external api

## [1.1.43] - 2023-02-15
### Changed
- Endpoints for starting stopping video sharing are implemented
- Endpoint for updating the shared video owner is implemented
- Notification of shared vido owner update to all participants is implemented
- Speaker stats update notification is extended with video owner information
- Automatic transfer of video ownership when the video owner leaves the call is implemented

## [1.1.42] - 2022-12-13
### Changed
- Enable back the private message option inside calls

## [1.1.41] - 2022-12-12
### Changed
- Disabled kick out participants send private message buttons

## [1.1.40] - 2022-11-29
### Changed
- Enabled the display of the moderator settings

## [1.1.39] - 2022-10-24
### Changed
- Added endpoints triggering UI language change and changed language selection order in order to have a direct changed language with api load (works in Firefox)

## [1.1.38] - 2022-08-18
### Changed
- disable handunraise when dominant speaker changes

## [1.1.37] - 2022-08-18
### Changed
- disabled notifications for raise hand

## [1.1.36] - 2022-07-07
### Changed
- Removed onClick event from Raise Hand Icon on video call screen in order to prevent participants panel from opening

## [1.1.35] - 2022-06-17
### Changed
- Added "Raise Hand" feature to the speaker stats for the virtual moderator

## [1.1.34] - 2022-03-29
### Changed
- Disabled thumbnailMenu because it was being displayed wrongly and causing some unstability

## [1.1.33] - 2022-03-26
### Updated
- Code cleaned unneccessary comments removed and one method is renamed

## [1.1.32] - 2022-01-27
### Updated
- Back to latest stable release [1.1.29] and fixed speaker stats again for testing in canary staging

## [1.1.31] - 2022-03-02
### Updated
- Update to create a testing suite for external api; new makefile target dev-external-api and necessary bash scripts are implemented

## [1.1.30] - 2022-03-02
### Updated
- Updated speaker stats and corresponding extenal api endpoints

## [1.1.29] - 2022-01-27
### Updated
- Update to latest stable release 6826 and fixed video on Safari and iOS issue

## [1.1.28] - 2021-11-03
### Updated
- Update to latest stable release 6433

## [1.1.27] - 2021-10-26
### Changed
- Test adapting speakerStats.

## [1.1.26] - 2021-10-26
### Changed
- Show updated room background.

## [1.1.25] - 2021-10-21
### Changed
- Undo previous changes.

## [1.1.24] - 2021-10-19
### Changed
- Undo changes for conference.js 224, 230.

## [1.1.23] - 2021-10-19
### Changed
- Undo changes for connect().

## [1.1.22] - 2021-10-18
### Changed
- Modified connections.js to console.log jwt when connecting.

## [1.1.21] - 2021-10-08
### Changed
- Modified connections.js to solve auth issue.

## [1.1.20] - 2021-10-06
### Updated
- Updated from the last version of the Jitsi official repo.

## [1.1.19] - 2021-05-07
### Added
- Disable NoiseGateProcessor due to inconsistency when more than 3 people in a meeting.

## [1.1.18] - 2021-05-05
### Added
- Re-adjust Noise Gate threshold.

## [1.1.17] - 2021-05-03
### Added
- Adjust close/open timing for Noise Gate.

## [1.1.16] - 2021-05-03
### Added
- Enable createNoisegateProcessor to test if it works after modifying campus-alpha-client config to enable audioLevels and set intervals.

## [1.1.15] - 2021-04-30
### Added
- Update to @ivicos/lib-jitsi-meet version 1.0.1.

## [1.1.14] - 2021-04-28
### Added
- Skip createNoiseGateProcessor and console.log 'audioLevel' and 'volume', to double check if even skipping the noise gate the audioLevel is 0.

## [1.1.13] - 2021-04-26
### Added
- Enable console.log for volume, oldVolume and newVolume values.
## [1.1.12] - 2021-04-26
### Added
- NoiseGate Effect created using the Thumbnails volume and the current audioLevel of each remote participant.

## [1.1.11] - 2021-04-15
### Added
- External API commands to access speaker stats
- Possibility to request either once or at multiple intervals the speaker stats

## [1.1.10] - 2021-04-15
### Fixed
- Restoring linux compatibility for build commands

## [1.1.9] - 2021-04-13
### Added
- Option enabling for the user to retry when the access to the camera failed

### Fixed
- Camera error notification also displayed in case of 1+ access to the camera

## [1.1.8] - 2021-04-09
### Added
- Documentation for contributions and deployment process

## [1.1.7] - 2021-04-08
### Added
- Add UI for the foreground overlay functionality

## [1.1.6] - 2021-04-08
### Changed
- Deleting specific release branch to only rely on master to create release.

## [1.1.5] - 2021-04-07
### Added
- Notify the client when a new foreground overlay is being set

## [1.1.4] - 2021-03-30
### Added
- Removing versioning for bundle files in import

## [1.1.3] - 2021-03-29
### Added
- Added external dependencies compiled file (external_api.js)

## [1.1.2] - 2021-03-24
### Fixed
- Synchronization issue for the 'set room background' command

### Added
- UI for the set room background feature

## [1.1.1] - 2021-03-23
### Fixed
- Fixing video order in tile view after rebasing

## [1.1.0] - 2021-03-23
### Added
- Updating the community version of Jitsi Meet (Rebasing with master)
- Breaking change for video order predictability

## [1.0.6] - 2021-03-23
### Changed
- Order of the video tracks is now deterministic and each user sees the same order of the video tracks

## [1.0.5] - 2021-03-23
### Added
- Adding the possibility to set a foreground overlay for each participant

## [1.0.4] - 2021-03-19
### Added
- Adding an external endpoint to add a background image/color to the room

## [1.0.3] - 2021-03-19
### Fixed
- Correction about which files should be packaged in the release.

## [1.0.2] - 2021-03-19
### Fixed
- ivicos-release does not trigger CI pipeline for PRs

## [1.0.1] - 2021-03-19
### Changed
- Debian Changelog not regenerated for every version but just keeping the last version
- Merge to master does not trigger a release/packaging anymore

### Added
- Merge to 'ivicos-release' triggers release/packaging

## [1.0.0] - 2021-03-18
### Added
- Adding CHANGELOG
- Adding Github actions for checks when new push on a branch and release management when merging with master
