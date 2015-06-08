module.exports = (config) ->

  config.set
    basePath: ''

    frameworks: [
      'mocha'
      'commonjs'
      'chai-jquery'
      'chai'
      'jquery-2.1.0'
    ]

    files: [
      # Modules under test - list specific
      './modules/**/Settings.js'
      './modules/**/UIUtil.js'

      # Spec files
      './test/spec/**/*Spec.coffee'
    ]

    exclude: []

    preprocessors:
      # Modules under test
      './modules/**/*.js': [ 'commonjs' ]

      # Spec files
      './test/spec/**/*Spec.coffee': [ 'coffee', 'commonjs' ]

    commonjsPreprocessor:
      shouldExecFile: (file) ->
        file.path.indexOf('/spec/') > -1
      processContent: (content, file, cb) ->
        cb("'use strict';\n" + content)

    coffeePreprocessor:
      options:
        bare: true
        sourceMap: false

    reporters: [ 'progress' ]
    port: 9876
    colors: true
    logLevel: config.LOG_INFO
    autoWatch: true
    browsers: [ 'PhantomJS' ]
    singleRun: true
