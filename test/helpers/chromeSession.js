
export default async function createChromeSession() {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            acceptInsecureCerts: true,
            "goog:chromeOptions": {
                args: [
                    'use-fake-device-for-media-stream',
                    'use-fake-ui-for-media-stream',
                    'disable-plugins',
                    'mute-audio',
                    'disable-infobars',
                    'autoplay-policy=no-user-gesture-required',
                    'auto-select-desktop-capture-source=Your Entire screen'
                ],
            }
        }
    })
    return browser
}