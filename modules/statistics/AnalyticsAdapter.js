function NoopAnalytics() {}
NoopAnalytics.prototype.sendEvent = function () {};

function AnalyticsAdapter() {
  var AnalyticsImpl = window.Analytics || NoopAnalytics;
  this.analytics = new AnalyticsImpl();
}

AnalyticsAdapter.prototype.sendEvent = function (action, data) {
  try {
    this.analytics.sendEvent.apply(this.analytics, arguments);
  } catch (ignored) {}
};

module.exports = new AnalyticsAdapter();