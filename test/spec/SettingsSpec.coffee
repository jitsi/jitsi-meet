'use strict'

describe 'Settings', ->
  Settings = require('../../modules/settings/Settings')
  generated_uid = window.localStorage.jitsiMeetId

  afterEach ->
    window.localStorage.clear()

  it 'should initialize correctly', ->
    settings = Settings.getSettings()
    assert.propertyVal settings, 'displayName', ''
    assert.propertyVal settings, 'email', ''
    assert.propertyVal settings, 'language', undefined
    assert.propertyVal settings, 'uid', generated_uid

  describe '#setDisplayName(displayName)', ->

    it 'should be able to set global display name', ->
      Settings.setDisplayName('My Name')
      assert.propertyVal Settings.getSettings(), 'displayName', 'My Name'

    it 'should set localStorage displayname', ->
      Settings.setDisplayName('My Name')
      assert.equal window.localStorage.displayname, 'My Name'

  describe '#setEmail(email)', ->

    it 'should be able to set a global email address', ->
      Settings.setEmail 'my@email.com'
      assert.propertyVal Settings.getSettings(), 'email', 'my@email.com'

    it 'should set localStorage email', ->
      Settings.setEmail 'my@email.com'
      assert.equal window.localStorage.email, 'my@email.com'

  describe '#setLanguage(language)', ->

    it 'should be able to get set global language', ->
      Settings.setLanguage 'Russian'
      assert.propertyVal Settings.getSettings(), 'language', 'Russian'

    it 'should set localStorage language', ->
      Settings.setLanguage 'Russian'
      assert.equal window.localStorage.language, 'Russian'

  describe '#getSettings()', ->

    before ->
      Settings.setDisplayName 'foo'
      Settings.setEmail 'foo@bar'
      Settings.setLanguage 'Luxembourgish'

    it 'should be able to get displayName', ->
      assert.propertyVal Settings.getSettings(), 'displayName', 'foo'

    it 'should be able to get email', ->
      assert.propertyVal Settings.getSettings(), 'email', 'foo@bar'

    it 'should be able to get language', ->
      assert.propertyVal Settings.getSettings(), 'language', 'Luxembourgish'

    it 'should be able to get uid', ->
      assert.propertyVal Settings.getSettings(), 'uid', generated_uid
