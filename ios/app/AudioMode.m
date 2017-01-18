#import "AudioMode.h"
#import "RCTLog.h"


@implementation AudioMode

RCT_EXPORT_MODULE();

typedef enum {
    kAudioModeDefault,
    kAudioModeAudioCall,
    kAudioModeVideoCall
} JitsiMeetAudioMode;

- (instancetype)init
{
    self = [super init];
    if (self) {
        _initialized = NO;
        _category = nil;
        _mode = nil;
        _session = [AVAudioSession sharedInstance];
    }
    return self;
}

- (dispatch_queue_t)methodQueue
{
    // Make sure all our methods run in the main thread.  The route change
    // notification runs there so this will make sure it will only be fired
    // after our changes have been applied (when we cause them, that is).
    return dispatch_get_main_queue();
}

- (void)routeChanged:(NSNotification*)notification {
    NSDictionary *dict = notification.userInfo;
    NSInteger reason = [[dict valueForKey:AVAudioSessionRouteChangeReasonKey]
                        integerValue];
    switch (reason) {
    case AVAudioSessionRouteChangeReasonCategoryChange: {
        // The category has changed, check if it's the one we want and adjust
        // as needed.
        BOOL success;
        NSError *error;

        if (_session.category != _category) {
            success = [_session setCategory: _category error: &error];
            if (!success || error) {
                RCTLogInfo(@"Error overriding the desired session category");
            }
        }

        if (_session.mode != _mode) {
            success = [_session setMode: _mode error: &error];
            if (!success || error) {
                RCTLogInfo(@"Error overriding the desired session mode");
            }
        }
    }
    default:
        // Do nothing
        break;
    }
}

- (NSDictionary *)constantsToExport
{
    return @{ @"AUDIO_CALL" : [NSNumber numberWithInt: kAudioModeAudioCall],
              @"VIDEO_CALL" : [NSNumber numberWithInt: kAudioModeVideoCall],
              @"DEFAULT"    : [NSNumber numberWithInt: kAudioModeDefault]
    };
};

RCT_EXPORT_METHOD(setMode:(int)mode
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    BOOL success;
    NSString *avCategory;
    NSString *avMode;

    switch (mode) {
    case kAudioModeAudioCall:
        avCategory = AVAudioSessionCategoryPlayAndRecord;
        avMode = AVAudioSessionModeVoiceChat;
        break;
    case kAudioModeVideoCall:
        avCategory = AVAudioSessionCategoryPlayAndRecord;
        avMode = AVAudioSessionModeVideoChat;
        break;
    case kAudioModeDefault:
        avCategory = AVAudioSessionCategorySoloAmbient;
        avMode = AVAudioSessionModeDefault;
        break;
    default:
        reject(@"setMode", @"Invalid mode", nil);
        return;
    }

    // Configure AVAudioSession category
    success = [_session setCategory: avCategory error: &error];
    if (!success || error) {
        reject(@"setMode", error.localizedDescription, error);
        return;
    }

    // Configure AVAudioSession mode
    success = [_session setMode: avMode error: &error];
    if (!success || error) {
        reject(@"setMode", error.localizedDescription, error);
        return;
    }

    // Save the desired mode and category
    _category = avCategory;
    _mode = avMode;

    // Initialize audio route changes observer if needed
    if (!_initialized) {
        [[NSNotificationCenter defaultCenter] addObserver: self
            selector: @selector(routeChanged:)
            name: AVAudioSessionRouteChangeNotification
            object: nil];
        _initialized = YES;
    }

    resolve(nil);
}

@end
