'use strict'

StreamEventTypes = require('../../service/RTC/StreamEventTypes')

describe 'RTC', ->

  sandbox = undefined
  RTC = undefined

  basicRTCProps =
    rtcUtils: null
    devices:
      audio: true
      video: true
    localStreams: []
    remoteStreams: {}
    localAudio: null
    localVideo: null

  # Mock objects
  MockEventEmitter = mockEventEmitter = undefined
  MockLocalStream = mockLocalStream = undefined

  beforeEach ->
    sandbox = sinon.sandbox.create()

    class MockEventEmitter
      constructor: ->
        mockEventEmitter = this
      on: sandbox.stub()
      removeListener: sandbox.stub()
      emit: sandbox.stub()

    class MockLocalStream
      constructor: ->
        mockLocalStream = this
      setMute: sandbox.stub()

    RTC = require('../../modules/RTC/RTC.js', {
      'events': MockEventEmitter
      './RTCUtils.js': ->
      './LocalStream.js': MockLocalStream
      './DataChannels': ->
      './MediaStream.js': ->
    })

  afterEach ->
    sandbox.restore()

  it 'should init basic properties', ->
    RTC.should.have.deep.property prop for prop of basicRTCProps

  describe '#addStreamListener', ->
    listener = 'bogus'
    eventType = 'bogus'

    it 'should invoke eventEmitter.on with correct args', ->
      RTC.addStreamListener listener, eventType

      mockEventEmitter.on.should.have.been.calledWithExactly eventType, listener
      mockEventEmitter.on.lastCall.args.should.deep.equal [eventType, listener]

  describe '#addListener', ->
    listener = 'bogus'
    eventType = 'bogus'

    it 'should invoke eventEmitter.on with correct args', ->
      RTC.addListener eventType, listener

      mockEventEmitter.on.should.have.been.calledWithExactly eventType, listener
      mockEventEmitter.on.lastCall.args.should.deep.equal [eventType, listener]

  describe '#removeStreamListener', ->
    listener = 'bogus'
    eventType = undefined

    beforeEach ->
      sandbox.spy RTC, 'removeStreamListener'

    it 'throws an exception', ->
      eventType = 'bogus'
      try
        RTC.removeStreamListener listener, eventType
      catch err

      RTC.removeStreamListener.should.have.thrown(err)

    it 'should invoke eventEmitter.removeListener', ->
      eventType = StreamEventTypes.EVENT_TYPE_LOCAL_CREATED
      try
        RTC.removeStreamListener listener, eventType
      catch err

      RTC.removeStreamListener.should.not.have.thrown(err)

      mockEventEmitter.removeListener.should.have.been.calledWithExactly eventType, listener
      mockEventEmitter.removeListener.lastCall.args.should.deep.equal [eventType, listener]

  describe '#createLocalStream', ->
    stream = type = change = videoType = isMuted = isGUMStream = undefined

    beforeEach ->
      RTC.localStreams = sandbox.stub()
      RTC.localStreams.push = sandbox.stub()

    afterEach ->
      sandbox.restore()
      stream = type = change = videoType = isMuted = isGUMStream = undefined

    it 'should push localStream if this.localStreams.length is 0', ->
      RTC.localStreams.length = sandbox.stub().returns 0
      RTC.localStreams.push = sandbox.stub()

      RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream
      RTC.localStreams.push.should.have.been.calledWithExactly mockLocalStream

    it 'should push localStream if this.localStreams[0].getOriginalStream != stream', ->
      RTC.localStreams = [
        getOriginalStream: -> 'foo'
      ]
      RTC.localStreams.push = sandbox.stub()

      RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream
      RTC.localStreams.push.should.have.been.calledWithExactly mockLocalStream

    it 'should invoke setMute with false if isMuted', ->
      isMuted = true

      RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream
      mockLocalStream.setMute.should.have.been.calledWithExactly false

    it 'should assign localAudio', ->
      type = 'audio'
      RTC.localVideo = RTC.localAudio = null

      RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream

      should.equal RTC.localVideo, null
      RTC.localAudio.should.equal mockLocalStream

    it 'should assign localVideo', ->
      RTC.localVideo = RTC.localAudio = null

      RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream

      should.equal RTC.localAudio, null
      RTC.localVideo.should.equal mockLocalStream

    it 'should invoke eventEmitter.emit with correct event', ->
      createdEvent = StreamEventTypes.EVENT_TYPE_LOCAL_CREATED
      changedEvent = StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED

      RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream
      mockEventEmitter.emit.should.have.been.calledWithExactly createdEvent, mockLocalStream, isMuted

      change = true

      RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream
      mockEventEmitter.emit.should.have.been.calledWithExactly changedEvent, mockLocalStream, isMuted

    it 'should return created localStream', ->
      mockLocalStream.should.deep.equal(
        RTC.createLocalStream stream, type, change, videoType, isMuted, isGUMStream)

  describe '#removeLocalStream', ->
    stream = undefined

    beforeEach ->
      RTC.localStreams = []

    it 'should remove stream from this.localStreams', ->
      stream = 'foo'

      RTC.localStreams.push getOriginalStream: -> stream
      RTC.removeLocalStream stream
      RTC.localStreams.length.should.equal 0

      RTC.localStreams.push getOriginalStream: -> 'bar'
      RTC.removeLocalStream stream
      RTC.localStreams.length.should.equal 1
