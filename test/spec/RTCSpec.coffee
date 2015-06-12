'use strict'

# Default required globals
global.URL = true

mockAPP = (type) ->
  switch type
    when 'CLEAR'
      delete global.APP

    else
      global.APP =
        xmpp:
          myJid: -> 'myJid'

describe 'RTC', ->

  sandbox = undefined
  RTC = undefined
  mock =
    events: undefined

  before ->
    sandbox = sinon.sandbox.create()

    mock.events = sandbox.stub()
#      EventEmitter: ->
#        on: sandbox.stub()

    RTC = require('../../modules/RTC/RTC.js', {
      'events': mock.events
      './RTCUtils.js': ->
      './LocalStream.js': ->
      './DataChannels': ->
      './MediaStream.js': ->
      '../../service/desktopsharing/DesktopSharingEventTypes': ->
      '../../service/RTC/MediaStreamTypes': ->
      '../../service/RTC/StreamEventTypes.js': ->
      '../../service/RTC/RTCEvents.js': ->
      '../../service/xmpp/XMPPEvents': ->
      '../../service/UI/UIEvents': ->
    })

  afterEach ->
    sandbox.restore()

  describe 'init', ->

    props =
      rtcUtils: null
      devices:
        audio: true
        video: true
      localStreams: []
      remoteStreams: {}
      localAudio: null
      localVideo: null

    afterEach ->
      mockAPP('CLEAR')

    it 'should init', ->
      RTC.should.have.deep.property prop for prop of props

  describe 'addStreamListener', ->
  
    it 'should invoke eventEmitter.on', ->
    