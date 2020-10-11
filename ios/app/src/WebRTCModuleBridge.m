
#import <AVFoundation/AVFoundation.h>
#import <CoreVideo/CVPixelBuffer.h>

#import "WebRTCModule.h"

#import "CustomRTCVideoCapturer.h"

#import "Digitales_Klassenzimmer-Swift.h"

@import WebRTC;
@import Socket;
@import CoreVideo;
@import Socket;


@implementation WebRTCModule (Bridging)

RCT_EXPORT_METHOD(getDisplayMedia:(NSString *)mediaType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSLog(@"trying get display media");
  // -------------- an attempt at custom video track ------------------------------//
    RTCVideoSource *videoSource = [self.peerConnectionFactory videoSource];
  
    NSString *trackUUID = [[NSUUID UUID] UUIDString];
    RTCVideoTrack *videoTrack = [self.peerConnectionFactory videoTrackWithSource:videoSource trackId:trackUUID];
  
  
    NSString *mediaStreamId = [[NSUUID UUID] UUIDString];
    RTCMediaStream *mediaStream
      = [self.peerConnectionFactory mediaStreamWithStreamId:mediaStreamId];
  
    NSMutableArray *tracks = [NSMutableArray array];
    NSMutableArray *tmp = [NSMutableArray array];
    if (videoTrack)
        [tmp addObject:videoTrack];
  
//    for (RTCMediaStreamTrack *track in tmp) {
//      [mediaStream addVideoTrack:(RTCVideoTrack *)track];
//
//      NSString *trackId = track.trackId;
//
//      self.localTracks[trackId] = track;
//    }
//
    for (RTCMediaStreamTrack *track in tmp) {
        [mediaStream addVideoTrack:(RTCVideoTrack *)track];
        NSString *trackId = track.trackId;

        self.localTracks[trackId] = track;
        [tracks addObject:@{
                          @"enabled": @(track.isEnabled),
                          @"id": trackId,
                          @"kind": track.kind,
                          @"label": trackId,
                          @"readyState": @"live",
                          @"remote": @(NO)
                          }];
    }

    self.localStreams[mediaStreamId] = mediaStream;
    resolve(@[ mediaStreamId, tracks ]);
  [self checkArgss:mediaStreamId resolver:^(id result) {
    NSLog(@"check argss resolved");
  } rejecter:^(NSString *code, NSString *message, NSError *error) {
    NSLog(@"check args errored");
  }];
}


RCT_EXPORT_METHOD(checkArgss:(NSString *)mediaStreamId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  
//  NSLog(@"Thread while writing - %@ %@", NSThread.mainThread, NSThread.currentThread);

  RTCMediaStream *stream = self.localStreams[mediaStreamId];
  RTCVideoTrack *videoTrack = stream.videoTracks[0];
  CustomRTCVideoCapturer *videoCapturer = [[CustomRTCVideoCapturer alloc] initWithDelegate:[videoTrack source]];
  // FIX LATER - remove loops after the recording/call ends or app closes
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0), ^{
    while (true) {
      [NSThread sleepForTimeInterval:0.20];
      RTCVideoFrame *videoFrame = [SocketShim getNextFrame];

      if (videoFrame == nil) {
//        NSLog(@"nil video frame");
      } else {
        if (stream.videoTracks.count != 1) {
          NSLog(@"length of video tracks");
        }
        @try {
          [videoCapturer didCaptureVideoFrame:videoFrame];
//            NSLog(@"Thread while writing loop - %@ %@", NSThread.mainThread, NSThread.currentThread);
        }
        @catch (NSException *exception) {
           NSLog(@"error while writing frame");
        }
      }
    }
  });
}


@end
