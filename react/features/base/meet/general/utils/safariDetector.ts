export const isSafari = (): boolean => {
    if (typeof window === "undefined") return false;

    const userAgent = window.navigator.userAgent;
    const isSafariUserAgent = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent);

    const hasSafariFeatures = "safari" in window || ("webkitAudioContext" in window && !("chrome" in window));

    return isSafariUserAgent || hasSafariFeatures;
};
