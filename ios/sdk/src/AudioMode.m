/*
 * Copyright @ 2018-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <AVFoundation/AVFoundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <WebRTC/WebRTC.h>

typedef enum {
    kAudioModeDefault,
    kAudioModeAudioCall,
    kAudioModeVideoCall
} JitsiMeetAudioMode;

@interface AudioMode : NSObject<RCTBridgeModule, RTCAudioSessionDelegate>

@property(nonatomic, strong) dispatch_queue_t workerQueue;

@end

@implementation AudioMode {
    JitsiMeetAudioMode activeMode;
    RTCAudioSessionConfiguration *defaultConfig;
    RTCAudioSessionConfiguration *audioCallConfig;
    RTCAudioSessionConfiguration *videoCallConfig;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (NSDictionary *)constantsToExport {
    return @{
        @"AUDIO_CALL" : [NSNumber numberWithInt: kAudioModeAudioCall],
        @"DEFAULT"    : [NSNumber numberWithInt: kAudioModeDefault],
        @"VIDEO_CALL" : [NSNumber numberWithInt: kAudioModeVideoCall]
    };
};

- (instancetype)init {
    self = [super init];
    if (self) {
        dispatch_queue_attr_t attributes =
        dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL,
                                                QOS_CLASS_USER_INITIATED, -1);
        _workerQueue = dispatch_queue_create("AudioMode.queue", attributes);

        activeMode = kAudioModeDefault;

        defaultConfig = [[RTCAudioSessionConfiguration alloc] init];
        defaultConfig.category = AVAudioSessionCategoryAmbient;
        defaultConfig.categoryOptions = 0;
        defaultConfig.mode = AVAudioSessionModeDefault;

        audioCallConfig = [[RTCAudioSessionConfiguration alloc] init];
        audioCallConfig.category = AVAudioSessionCategoryPlayAndRecord;
        audioCallConfig.categoryOptions = AVAudioSessionCategoryOptionAllowBluetooth;
        audioCallConfig.mode = AVAudioSessionModeVoiceChat;

        videoCallConfig = [[RTCAudioSessionConfiguration alloc] init];
        videoCallConfig.category = AVAudioSessionCategoryPlayAndRecord;
        videoCallConfig.categoryOptions = AVAudioSessionCategoryOptionAllowBluetooth;
        videoCallConfig.mode = AVAudioSessionModeVideoChat;

        RTCAudioSession *session = [RTCAudioSession sharedInstance];
        [session addDelegate:self];
    }

    return self;
}

- (dispatch_queue_t)methodQueue {
    // Use a dedicated queue for audio mode operations.
    return _workerQueue;
}

- (BOOL)setConfig:(RTCAudioSessionConfiguration *)config
            error:(NSError * _Nullable *)outError {

    RTCAudioSession *session = [RTCAudioSession sharedInstance];
    [session lockForConfiguration];
    BOOL success = [session setConfiguration:config error:outError];
    [session unlockForConfiguration];

    return success;
}

#pragma mark - Exported methods

RCT_EXPORT_METHOD(setMode:(int)mode
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    RTCAudioSessionConfiguration *config;
    NSError *error;

    switch (mode) {
    case kAudioModeAudioCall:
        config = audioCallConfig;
        break;
    case kAudioModeDefault:
        config = defaultConfig;
        break;
    case kAudioModeVideoCall:
        config = videoCallConfig;
        break;
    default:
        reject(@"setMode", @"Invalid mode", nil);
        return;
    }

    activeMode = mode;

    if ([self setConfig:config error:&error]) {
        resolve(nil);
    } else {
        reject(@"setMode", error.localizedDescription, error);
    }
}

#pragma mark - RTCAudioSessionDelegate

- (void)audioSessionDidChangeRoute:(RTCAudioSession *)session
                            reason:(AVAudioSessionRouteChangeReason)reason
                     previousRoute:(AVAudioSessionRouteDescription *)previousRoute {
    if (reason == AVAudioSessionRouteChangeReasonCategoryChange) {
        // The category has changed. Check if it's the one we want and adjust as
        // needed. This notification is posted on a secondary thread, so make
        // sure we switch to our worker thread.
        dispatch_async(_workerQueue, ^{
            // We don't want to touch the category when in default mode.
            // This is to play well with other components which could be integrated
            // into the final application.
            if (self->activeMode != kAudioModeDefault) {
                NSLog(@"Audio route changed, reapplying RTCAudioSession config");
                RTCAudioSessionConfiguration *config
                    = self->activeMode == kAudioModeAudioCall ? self->audioCallConfig : self->videoCallConfig;
                [self setConfig:config error:nil];
            }
        });
    }
}

- (void)audioSession:(RTCAudioSession *)audioSession didSetActive:(BOOL)active {
    NSLog(@"[AudioMode] Audio session didSetActive:%d", active);
}

@end
