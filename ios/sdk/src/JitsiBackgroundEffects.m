#import <ImageIO/ImageIO.h>
#import <stdint.h>

#import "JitsiBackgroundEffects+Private.h"
#import "JMBackgroundFrameProcessor.h"

@interface JitsiBackgroundEffects ()

+ (CGImagePropertyOrientation)orientationForImage:(UIImage *)image;
+ (BOOL)applyMode:(JitsiBackgroundEffectMode)mode
   backgroundImage:(nullable UIImage *)image
           session:(NSUInteger)session
            choice:(NSString *)choice;

@end

@implementation JMBackgroundSettings

- (instancetype)initWithMode:(JitsiBackgroundEffectMode)mode
             backgroundImage:(CIImage *)backgroundImage
                  generation:(NSUInteger)generation
                sessionEpoch:(NSUInteger)sessionEpoch {
    self = [super init];
    if (self) {
        _mode = mode;
        _backgroundImage = backgroundImage;
        _generation = generation;
        _sessionEpoch = sessionEpoch;
    }
    return self;
}

@end

@implementation JitsiBackgroundEffects

static JMBackgroundSettings *currentSettings;
static JitsiBackgroundEffectStatus currentStatus;
static BOOL currentSessionActive;
static NSString *currentChoice;
static NSString *currentOwner;
static NSUInteger currentOwnerRevision;

+ (void)initialize {
    if (self == [JitsiBackgroundEffects class]) {
        currentSettings = [[JMBackgroundSettings alloc] initWithMode:JitsiBackgroundEffectModeNone
                                                     backgroundImage:nil
                                                          generation:0
                                                        sessionEpoch:0];
        currentStatus = JitsiBackgroundEffectStatusInactive;
        currentChoice = @"none";
    }
}

+ (NSUInteger)beginSession {
    @synchronized(self) {
        NSUInteger nextEpoch = currentSettings.sessionEpoch + 1;
        currentSettings = [[JMBackgroundSettings alloc] initWithMode:JitsiBackgroundEffectModeNone
                                                     backgroundImage:nil
                                                          generation:currentSettings.generation + 1
                                                        sessionEpoch:nextEpoch];
        currentStatus = JitsiBackgroundEffectStatusInactive;
        currentSessionActive = YES;
        currentChoice = @"none";
        return nextEpoch;
    }
}

+ (NSUInteger)claimOwner:(NSString *)owner {
    @synchronized(self) {
        if (![currentOwner isEqualToString:owner]) {
            [self endSession:currentSettings.sessionEpoch];
            currentOwner = [owner copy];
            currentOwnerRevision += 1;
        }
        return currentOwnerRevision;
    }
}

+ (NSUInteger)advanceOwner:(NSString *)owner {
    @synchronized(self) {
        if ([currentOwner isEqualToString:owner]) {
            [self freezeOwner:owner];
            currentOwnerRevision += 1;
        }
        return currentOwnerRevision;
    }
}

+ (NSString *)ownerSnapshot {
    @synchronized(self) {
        return currentOwner ?: @"";
    }
}

+ (BOOL)isOwnerCurrent:(NSString *)owner {
    @synchronized(self) {
        return [owner isEqualToString:currentOwner ?: @""];
    }
}

+ (BOOL)isOwnerCurrent:(NSString *)owner revision:(NSUInteger)revision {
    @synchronized(self) {
        return [currentOwner isEqualToString:owner] && currentOwnerRevision == revision;
    }
}

+ (void)freezeOwner:(NSString *)owner {
    @synchronized(self) {
        if ([currentOwner isEqualToString:owner]) {
            [self endSession:currentSettings.sessionEpoch];
        }
    }
}

+ (void)releaseOwner:(NSString *)owner {
    @synchronized(self) {
        if ([currentOwner isEqualToString:owner]) {
            [self freezeOwner:owner];
            currentOwner = nil;
            currentOwnerRevision += 1;
        }
    }
}

+ (NSUInteger)beginSessionForOwner:(NSString *)owner revision:(NSUInteger)revision {
    @synchronized(self) {
        if (!currentOwner && owner.length == 0) {
            currentOwner = @"";
            currentOwnerRevision = revision;
        }
        return [currentOwner isEqualToString:owner] && currentOwnerRevision == revision ? [self beginSession] : 0;
    }
}

+ (void)freezeOwner:(NSString *)owner revision:(NSUInteger)revision {
    @synchronized(self) {
        if ([currentOwner isEqualToString:owner] && currentOwnerRevision == revision) {
            [self freezeOwner:owner];
        }
    }
}

+ (void)endSession:(NSUInteger)session owner:(NSString *)owner revision:(NSUInteger)revision {
    @synchronized(self) {
        if ([currentOwner isEqualToString:owner] && currentOwnerRevision == revision) {
            [self endSession:session];
        }
    }
}

+ (BOOL)isCurrentSettings:(JMBackgroundSettings *)settings {
    @synchronized(self) {
        return currentSessionActive && settings.generation == currentSettings.generation
            && settings.sessionEpoch == currentSettings.sessionEpoch;
    }
}

+ (BOOL)setMode:(JitsiBackgroundEffectMode)mode backgroundImage:(UIImage *)image {
    return [self setMode:mode backgroundImage:image session:[self settingsSnapshot].sessionEpoch];
}

+ (BOOL)setMode:(JitsiBackgroundEffectMode)mode
  backgroundImage:(UIImage *)image
          session:(NSUInteger)session {
    NSString *choice = mode == JitsiBackgroundEffectModeBlurLight ? @"blur-light"
        : mode == JitsiBackgroundEffectModeBlur ? @"blur" : @"none";
    return [self applyMode:mode backgroundImage:image session:session choice:choice];
}

+ (BOOL)selectMode:(JitsiBackgroundEffectMode)mode
   backgroundImage:(UIImage *)image
            choice:(NSString *)choice
           session:(NSUInteger)session {
    @synchronized(self) {
        if (!currentSessionActive || session != currentSettings.sessionEpoch) {
            return NO;
        }
    }
    return [self applyMode:mode backgroundImage:image session:session choice:choice];
}

+ (BOOL)applyMode:(JitsiBackgroundEffectMode)mode
   backgroundImage:(UIImage *)image
           session:(NSUInteger)session
            choice:(NSString *)choice {
    if (mode < JitsiBackgroundEffectModeNone || mode > JitsiBackgroundEffectModeBlurLight) {
        return NO;
    }

    CIImage *background = nil;
    if (mode == JitsiBackgroundEffectModeImage) {
        CGImageRef cgImage = image.CGImage;
        if (!cgImage || CGImageGetWidth(cgImage) == 0 || CGImageGetHeight(cgImage) == 0
                || (uint64_t)CGImageGetWidth(cgImage) * CGImageGetHeight(cgImage) > 5000000) {
            return NO;
        }
        background = [[CIImage imageWithCGImage:cgImage] imageByApplyingOrientation:[self orientationForImage:image]];
        CIImage *opaqueBase = [[CIImage imageWithColor:[CIColor colorWithRed:0.09 green:0.13 blue:0.2 alpha:1]]
                               imageByCroppingToRect:background.extent];
        background = [[background imageByCompositingOverImage:opaqueBase] imageByCroppingToRect:background.extent];
    }

    @synchronized(self) {
        if (!currentSessionActive || session != currentSettings.sessionEpoch) {
            return NO;
        }
        currentSettings = [[JMBackgroundSettings alloc] initWithMode:mode
                                                     backgroundImage:background
                                                          generation:currentSettings.generation + 1
                                                        sessionEpoch:currentSettings.sessionEpoch];
        currentStatus = mode == JitsiBackgroundEffectModeNone
            ? JitsiBackgroundEffectStatusInactive : JitsiBackgroundEffectStatusProcessing;
        currentChoice = choice;
    }
    return YES;
}

+ (CGImagePropertyOrientation)orientationForImage:(UIImage *)image {
    switch (image.imageOrientation) {
        case UIImageOrientationDown: return kCGImagePropertyOrientationDown;
        case UIImageOrientationLeft: return kCGImagePropertyOrientationLeft;
        case UIImageOrientationRight: return kCGImagePropertyOrientationRight;
        case UIImageOrientationUpMirrored: return kCGImagePropertyOrientationUpMirrored;
        case UIImageOrientationDownMirrored: return kCGImagePropertyOrientationDownMirrored;
        case UIImageOrientationLeftMirrored: return kCGImagePropertyOrientationLeftMirrored;
        case UIImageOrientationRightMirrored: return kCGImagePropertyOrientationRightMirrored;
        default: return kCGImagePropertyOrientationUp;
    }
}

+ (void)reset {
    [self beginSession];
}

+ (void)endSession:(NSUInteger)session {
    @synchronized(self) {
        if (session != 0 && session == currentSettings.sessionEpoch) {
            currentSettings = [[JMBackgroundSettings alloc] initWithMode:JitsiBackgroundEffectModeNone
                                                         backgroundImage:nil
                                                              generation:currentSettings.generation + 1
                                                            sessionEpoch:session + 1];
            currentStatus = JitsiBackgroundEffectStatusInactive;
            currentSessionActive = NO;
            currentChoice = @"none";
        }
    }
}

+ (JitsiBackgroundEffectMode)mode {
    return [self settingsSnapshot].mode;
}

+ (JitsiBackgroundEffectStatus)status {
    @synchronized(self) {
        return currentStatus;
    }
}

+ (NSDictionary *)curatedState {
    @synchronized(self) {
        NSString *status = !currentSessionActive ? @"inactive"
            : currentStatus == JitsiBackgroundEffectStatusProcessing ? @"processing"
            : currentStatus == JitsiBackgroundEffectStatusUnavailable ? @"unavailable" : @"inactive";
        return @{ @"sessionId": @(currentSessionActive ? currentSettings.sessionEpoch : 0),
                  @"choice": currentChoice, @"status": status };
    }
}

+ (JMBackgroundSettings *)settingsSnapshot {
    @synchronized(self) {
        return currentSettings;
    }
}

+ (void)reportUnavailableForGeneration:(NSUInteger)generation {
    @synchronized(self) {
        if (generation == currentSettings.generation && currentSettings.mode != JitsiBackgroundEffectModeNone) {
            currentStatus = JitsiBackgroundEffectStatusUnavailable;
        }
    }
}

+ (void)reportProcessingForGeneration:(NSUInteger)generation {
    @synchronized(self) {
        if (generation == currentSettings.generation && currentSettings.mode != JitsiBackgroundEffectModeNone) {
            currentStatus = JitsiBackgroundEffectStatusProcessing;
        }
    }
}

+ (id<RTCVideoCapturerDelegate>)makeProcessorWithVideoSource:(RTCVideoSource *)videoSource {
    return [[JMBackgroundFrameProcessor alloc] initWithVideoSource:videoSource
                                                    maskGenerator:nil
                                                     sessionEpoch:[self settingsSnapshot].sessionEpoch];
}

+ (void)forwardFrame:(RTCVideoFrame *)frame
            capturer:(RTCVideoCapturer *)capturer
         videoSource:(RTCVideoSource *)videoSource
            settings:(JMBackgroundSettings *)settings {
    @synchronized(self) {
        if ([self isCurrentSettings:settings]) {
            [videoSource capturer:capturer didCaptureVideoFrame:frame];
        }
    }
}

@end
