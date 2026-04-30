module.exports = {
    require: ['./setup.js'],
    spec: './**/*_spec.js',
    timeout: 120000,
    reporter: 'allure-mocha',
    reporterOptions: 'resultsDir=./allure-results,extraReporters=spec',
};
