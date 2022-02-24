# WebdriverIO Test Automation Framework

## Steps to run tests locally:
* Run <strong>npm install</strong> command
* Start de app locally with <i>make dev</i> command
* Running all tests: <strong>npx wdio run ./wdio.conf.js</strong>
* Running specific test: <strong>npx wdio run ./wdio.conf.js --spec testName.js</strong>
* Running tests will generate the <i>allure-results</i> folder

## Steps to generate allure reports:
* Check if the <i>allure-results</i> was generated
* In order to generate the <i>allure-reports</i>, run the following command: allure generate allure-results/ && allure open
* If the allure-report has already been generated, there will be a conflict; in order to avoid this, the <strong>--clean</strong> flag needs to be used and the following command would be required: allure generate allure-results/ --clean && allure open