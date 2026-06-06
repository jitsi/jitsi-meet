module.exports = {
    require: ['./setup.js'],
    spec: './**/*_spec.js',
    timeout: 120000,
    exit: true, // force-exit after tests: @xmpp/reconnect leaves open handles
    reporter: 'allure-mocha',
    reporterOptions: 'resultsDir=./allure-results,extraReporters=spec',
};
