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

typedef enum {
    kAudioModeDefault,
    kAudioModeAudioCall,
    kAudioModeVideoCall
} JitsiMeetAudioMode;

@interface AudioMode : NSObject<RCTBridgeModule>

@property(nonatomic, strong) dispatch_queue_t workerQueue;

@end

@implementation AudioMode {
    NSString *_avCategory;
    NSString *_avMode;
    JitsiMeetAudioMode _mode;
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
        _avCategory = nil;
        _avMode = nil;
        _mode = kAudioModeDefault;

        dispatch_queue_attr_t attributes =
        dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL,
                                                QOS_CLASS_USER_INITIATED, -1);
        _workerQueue = dispatch_queue_create("AudioMode.queue", attributes);

        // AVAudioSession is a singleton and other parts of the application such as
        // WebRTC may undo the settings. Make sure that the settings are reapplied
        // upon undoes.
        [[NSNotificationCenter defaultCenter]
             addObserver:self
                selector:@selector(routeChanged:)
                    name:AVAudioSessionRouteChangeNotification
                  object:nil];
    }
    return self;
}

- (dispatch_queue_t)methodQueue {
    // Use a dedicated queue for audio mode operations.
    return _workerQueue;
}

- (void)routeChanged:(NSNotification*)notification {
    NSInteger reason
        = [[notification.userInfo
                valueForKey:AVAudioSessionRouteChangeReasonKey]
            integerValue];

    switch (reason) {
    case AVAudioSessionRouteChangeReasonCategoryChange: {
        // The category has changed. Check if it's the one we want and adjust as
        // needed. This notification is posted on a secondary thread, so make
        // sure we switch to our worker thread.
        dispatch_async(_workerQueue, ^{
            [self setCategory:self->_avCategory mode:self->_avMode error:nil];
        });
        break;
    }
    default:
        // Do nothing.
        break;
    }
}

- (BOOL)setCategory:(NSString *)category
               mode:(NSString *)mode
              error:(NSError * _Nullable *)outError {
    AVAudioSession *session = [AVAudioSession sharedInstance];

    // We don't want to touch the category when setting the default mode.
    // This is to play well with other components which could be integrated
    // into the final application.
    if (_mode == kAudioModeDefault) {
        return YES;
    }

    // Nothing to do.
    if (category == nil && mode == nil) {
        return YES;
    }

    if (session.category != category
            && ![session setCategory:category error:outError]) {
        RCTLogError(@"Failed to (re)apply specified AVAudioSession category!");
        return NO;
    }

    if (session.mode != mode && ![session setMode:mode error:outError]) {
        RCTLogError(@"Failed to (re)apply specified AVAudioSession mode!");
        return NO;
    }

    return YES;
}

RCT_EXPORT_METHOD(setMode:(int)mode
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    NSString *avCategory = nil;
    NSString *avMode = nil;
    NSError *error;

    switch (mode) {
    case kAudioModeAudioCall:
        avCategory = AVAudioSessionCategoryPlayAndRecord;
        avMode = AVAudioSessionModeVoiceChat;
        break;
    case kAudioModeDefault:
        break;
    case kAudioModeVideoCall:
        avCategory = AVAudioSessionCategoryPlayAndRecord;
        avMode = AVAudioSessionModeVideoChat;
        break;
    default:
        reject(@"setMode", @"Invalid mode", nil);
        return;
    }

    // Save the desired/specified category and mode so that they may be
    // reapplied.
    _avCategory = avCategory;
    _avMode = avMode;
    _mode = mode;

    if (![self setCategory:avCategory mode:avMode error:&error] || error) {
        reject(@"setMode", error.localizedDescription, error);
    } else {
        resolve(nil);
    }
}

@end
