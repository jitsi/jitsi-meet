#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/** Background treatment selected for captured video. */
typedef NS_ENUM(NSInteger, JitsiBackgroundEffectMode) {
    JitsiBackgroundEffectModeNone,
    JitsiBackgroundEffectModeBlur,
    JitsiBackgroundEffectModeSolid,
    JitsiBackgroundEffectModeImage,
    JitsiBackgroundEffectModeBlurLight
};

/** Current processing state of the selected background treatment. */
typedef NS_ENUM(NSInteger, JitsiBackgroundEffectStatus) {
    JitsiBackgroundEffectStatusInactive,
    JitsiBackgroundEffectStatusProcessing,
    JitsiBackgroundEffectStatusUnavailable
};

/** Coordinates background effect state for the active video session. */
@interface JitsiBackgroundEffects : NSObject
@end

NS_ASSUME_NONNULL_END
