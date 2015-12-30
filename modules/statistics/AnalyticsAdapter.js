class NoopAnalytics {
  sendEvent () {}
}

const AnalyticsImpl = window.Analytics || NoopAnalytics;

class AnalyticsAdapter {
  constructor () {
    this.analytics = new AnalyticsImpl();
  }

  sendEvent (...args) {
    try {
      this.analytics.sendEvent(...args);
    } catch (ignored) {}
  }
}

export default new AnalyticsAdapter();
