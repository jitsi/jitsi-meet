// Setup file for Vitest test environment in Jitsi Meet
if (typeof window !== 'undefined' && window.location) {
    try {
        window.location.href = 'https://meet.jit.si';
    } catch {
        // Ignore if read-only in some environments
    }
}
