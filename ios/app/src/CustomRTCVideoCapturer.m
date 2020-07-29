//
//  CustomRTCVideoCapturer.m
//  jitsi-meet
//
//  Created by Varun Bansal on 18/07/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "CustomRTCVideoCapturer.h"

#import <WebRTC/RTCVideoFrameBuffer.h>



@implementation CustomRTCVideoCapturer



- (instancetype)initWithDelegate:(__weak id<RTCVideoCapturerDelegate>)delegate {

    return [super initWithDelegate:delegate];

}



#pragma mark - CustomVideoSampleDelegate



- (void)didCaptureVideoFrame:(RTCVideoFrame*)videoFrame {

    [self.delegate capturer:self didCaptureVideoFrame:videoFrame];

}



@end

