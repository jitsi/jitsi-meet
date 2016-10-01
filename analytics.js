(function (ctx) {
  function Analytics() {
    /**
     * Google Analytics
     */
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ga('create', 'UA-319188-14', 'jit.si');
    ga('send', 'pageview');
  }

  Analytics.prototype.sendEvent = function (action, data, label, browserName) {
    // empty label if missing value for it and add the value,
    // the value should be integer or null
    var value = Math.round(parseFloat(data));

    ga('send', 'event', 'jit.si',
        action + '.' + browserName, label ? label : "", value ? value : null);
  };

  Analytics.prototype.sendFeedback = function (data, label, browserName) {
      this.sendEvent('feedback.rating', data.overall, label, browserName);
  };

  ctx.Analytics = Analytics;
}(window));
