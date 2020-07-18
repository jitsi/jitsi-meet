//
//  CustomRTCVideoCapturer.h
//  app
//
//  Created by Varun Bansal on 18/07/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#ifndef CustomRTCVideoCapturer_h
#define CustomRTCVideoCapturer_h

#import <WebRTC/RTCVideoCapturer.h>

#import <WebRTC/RTCCVPixelBuffer.h>

#import <WebRTC/RTCLogging.h>


@protocol CustomVideoSampleDelegate <NSObject>

- (void)didCaptureVideoFrame:(RTCVideoFrame*)videoFrame;

@end


@interface CustomRTCVideoCapturer : RTCVideoCapturer <CustomVideoSampleDelegate>

@end


#endif /* CustomRTCVideoCapturer_h */
