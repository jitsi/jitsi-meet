'use strict'

describe 'UIUtilSpec', ->
  UIUtil = require('../../modules/UI/util/UIUtil')

  describe '#buttonClick(id, classname)', ->

    it 'should add the class to the clicked element', ->
      document.body.innerHTML = '<div id="test">test</div>'
      UIUtil.buttonClick('#test', "hidden")
      $('#test').should.have.class('hidden')

    it 'should remove the class to the clicked element', ->
      document.body.innerHTML = '<div id="test" class="hidden">test</div>'
      UIUtil.buttonClick('#test', "hidden")
      $('#test').should.not.have.class('hidden')
