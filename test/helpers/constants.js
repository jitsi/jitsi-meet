export const BASE_URL = process.env.BASE_URL || 'https://localhost:8080';

export const DEFAULT_CONFIG =
"config.requireDisplayName=false"
+ "&config.debug=true"
+ "&config.testing.testMode=true"
+ "&config.disableAEC=true"
+ "&config.disableNS=true"
+ "&config.enableTalkWhileMuted=false"
+ "&config.callStatsID=false"
+ "&config.alwaysVisibleToolbar=true"
+ "&config.p2p.enabled=false"
+ "&config.p2p.useStunTurn=false"
+ "&config.pcStatsInterval=1500"
+ "&config.prejoinConfig.enabled=false"
+ "&config.gatherStats=true"
+ "&config.disable1On1Mode=true"
+ "&config.analytics.disabled=true"
+ "&interfaceConfig.SHOW_CHROME_EXTENSION_BANNER=false"
+ "&interfaceConfig.DISABLE_FOCUS_INDICATOR=true";

export const FIRST_PARTICIPANT = "First participant";
export const SECOND_PARTICIPANT = "Second participant";
export const THIRD_PARTICIPANT = "Third participant";

export const ENTER_KEY = "\uE007";