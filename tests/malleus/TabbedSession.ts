/**
 * Runs several participants in one browser session, one per tab.
 *
 * Every WebDriver command a tab's participant issues is serialized with the other tabs' commands and preceded,
 * when needed, by a switch to the tab's window handle. Commands that are plain JS loops around other commands
 * (waitUntil) are not serialized themselves, or they would deadlock on the commands they issue.
 */
/**
 * Browser methods that must not be serialized: they are not WebDriver commands but helpers that call other
 * (serialized) commands, or event-emitter plumbing that is not tab specific.
 */
const PASSTHROUGH: Set<string | symbol> = new Set([
    'waitUntil', 'pause', 'call', 'debug',
    'on', 'once', 'off', 'emit', 'addListener', 'removeListener', 'removeAllListeners', 'listeners',
    'addCommand', 'overwriteCommand', 'sessionSubscribe', 'sessionUnsubscribe',
    'then', 'catch', 'finally'
]);

export class TabbedSession {
    readonly browser: WebdriverIO.Browser;

    private tabs: string[] = [];
    private currentTab?: string;
    private lock: Promise<unknown> = Promise.resolve();

    constructor(browser: WebdriverIO.Browser) {
        this.browser = browser;
    }

    /**
     * Runs `fn` while holding the session's lock, i.e. with no other tab's command in flight.
     */
    private withLock<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.lock.then(fn, fn);

        this.lock = run.catch(() => undefined);

        return run;
    }

    /**
     * Makes sure the browser is on the given tab. Must be called with the lock held.
     */
    private async switchTo(handle: string): Promise<void> {
        if (this.currentTab !== handle) {
            await this.browser.switchToWindow(handle);
            this.currentTab = handle;
        }
    }

    /**
     * Opens the tab with the given index (the first one is the browser's initial tab) and returns a driver bound to
     * it. Tabs are opened in order, so this is meant to be called with 0, 1, 2... as participants start.
     */
    async openTab(index: number): Promise<WebdriverIO.Browser> {
        await this.withLock(async () => {
            if (this.tabs.length === 0) {
                this.tabs.push(await this.browser.getWindowHandle());
                this.currentTab = this.tabs[0];
            }
            while (this.tabs.length <= index) {
                // Creating a window does not make it the current browsing context (WebDriver "New Window"), so
                // switch explicitly; the tab's first command would otherwise run in whatever tab was current.
                const { handle } = await this.browser.createWindow('tab');

                await this.browser.switchToWindow(handle);
                this.tabs.push(handle);
                this.currentTab = handle;
            }
        });

        return this.tabDriver(this.tabs[index]);
    }

    /**
     * A proxy of the browser whose commands run on the given tab.
     */
    private tabDriver(handle: string): WebdriverIO.Browser {
        const { browser } = this;

        return new Proxy(browser, {
            get: (target, prop, receiver) => {
                const value = Reflect.get(target, prop, receiver);

                if (typeof value !== 'function' || PASSTHROUGH.has(prop)) {
                    return value;
                }

                return (...args: unknown[]) => this.withLock(async () => {
                    await this.switchTo(handle);

                    return value.apply(target, args);
                });
            }
        });
    }
}
