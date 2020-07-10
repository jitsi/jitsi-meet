
#import <AVFoundation/AVFoundation.h>
#import <CoreVideo/CVPixelBuffer.h>

#import "WebRTCModule.h"

#import "Digitales_Klassenzimmer-Swift.h"

@import WebRTC;
@import Socket;
@import CoreVideo;
@import Socket;


@implementation WebRTCModule (Bridging)



RCT_EXPORT_METHOD(checkArgss:(NSString *)mediaType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  
// -------------- an attempt at custom video track ------------------------------//
//  RTCVideoSource *videoSource = [self.peerConnectionFactory videoSource];
//
//  NSString *trackUUID = [[NSUUID UUID] UUIDString];
//  RTCVideoTrack *videoTrack = [self.peerConnectionFactory videoTrackWithSource:videoSource trackId:trackUUID];
//
//
//  NSString *mediaStreamId = [[NSUUID UUID] UUIDString];
//  RTCMediaStream *mediaStream
//    = [self.peerConnectionFactory mediaStreamWithStreamId:mediaStreamId];
//
//  NSMutableArray *tmp = [NSMutableArray array];
//  if (videoTrack)
//      [tmp addObject:videoTrack];
//
//  for (RTCMediaStreamTrack *track in tmp) {
//    [mediaStream addVideoTrack:(RTCVideoTrack *)track];
//
//    NSString *trackId = track.trackId;
//
//    self.localTracks[trackId] = track;
//  }
//
//  self.localStreams[mediaStreamId] = mediaStream;
//  videoTrack.isEnabled = true;
//  int count = 0;
//  for (NSString *peerConnectionId in self.localStreams.allKeys) {
//    count += 1;
//    if(count != self.localStreams.allKeys.count){continue;}
//        RTCMediaStream *stream = self.localStreams[peerConnectionId];
//        for (RTCVideoTrack *oldVideoTrack in stream.videoTracks) {
//            [stream removeVideoTrack:oldVideoTrack];
//        }
//        [stream addVideoTrack:videoTrack];
//
//    break;
//      }
// -------------- an attempt at custom video track ends ----------------------------//
  RTCVideoCapturer *videoCapturer = [[RTCVideoCapturer alloc] init];
  // FIX LATER - remove loops after the recording/call ends or app closes
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    while (true) {
      RTCVideoFrame *videoFrame = [SocketShim testFunc];
      if (videoFrame == nil) {
//        NSLog(@"nil video frame");
      } else {
        NSLog(@"wrting frame");
//        [[videoTrack source] capturer:videoCapturer didCaptureVideoFrame:videoFrame];
        int count = 0;
        BOOL stop = false;
        NSLog(@"starting loop");
        for (NSString *steamId in self.localStreams.allKeys) {
            NSLog(@"peerConnectionId");
          if (stop == true) {
            NSLog(@"stopping loop");
            break;
          }
            RTCMediaStream *stream = self.localStreams[steamId];
            for (RTCVideoTrack *videoTrack in stream.videoTracks) {
              count += 1;
              // dont know which track to write to and can only write to one track
              // so writing randomly
              if (arc4random_uniform(5) == count) {
                NSLog(@"writing to track");
                [[videoTrack source] capturer:videoCapturer didCaptureVideoFrame:videoFrame];
                stop = true;
                break;
              } else {
                NSLog(@"skipping frame");
              }

              NSLog(@"bansak boys");
            }
          }
      }
    }
  });
}


@end
