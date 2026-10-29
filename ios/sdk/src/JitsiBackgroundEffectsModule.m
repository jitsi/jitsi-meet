#import "JitsiBackgroundEffectsModule.h"

#import "JitsiBackgroundEffects+Private.h"

@interface JitsiBackgroundEffectsModule ()

+ (NSArray<NSDictionary *> *)presets;
+ (NSURL *)catalogDirectory;
+ (NSDictionary *)state;

@end

@implementation JitsiBackgroundEffectsModule

RCT_EXPORT_MODULE(JitsiBackgroundEffects);

RCT_REMAP_METHOD(getState, getStateForOwner:(NSString *)owner revision:(nonnull NSNumber *)revision
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    if (![owner isKindOfClass:[NSString class]]
            || ![revision isKindOfClass:[NSNumber class]]
            || CFGetTypeID((__bridge CFTypeRef)revision) == CFBooleanGetTypeID()
            || revision.doubleValue != revision.unsignedIntegerValue) {
        reject(@"invalid_selection", @"Background owner is required", nil);
        return;
    }
    @synchronized([JitsiBackgroundEffects class]) {
        if (![JitsiBackgroundEffects isOwnerCurrent:owner revision:revision.unsignedIntegerValue]) {
            reject(@"stale_session", @"Background owner is no longer active", nil);
            return;
        }
        resolve([JitsiBackgroundEffectsModule state]);
    }
}

RCT_REMAP_METHOD(beginSession, beginSessionForOwner:(NSString *)owner revision:(nonnull NSNumber *)revision
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    if (![owner isKindOfClass:[NSString class]]
            || ![revision isKindOfClass:[NSNumber class]]
            || CFGetTypeID((__bridge CFTypeRef)revision) == CFBooleanGetTypeID()
            || revision.doubleValue != revision.unsignedIntegerValue) {
        reject(@"invalid_selection", @"Background owner is required", nil);
        return;
    }
    @synchronized([JitsiBackgroundEffects class]) {
        if (![JitsiBackgroundEffects beginSessionForOwner:owner revision:revision.unsignedIntegerValue]) {
            reject(@"stale_session", @"Background owner is no longer active", nil);
            return;
        }
        resolve([JitsiBackgroundEffectsModule state]);
    }
}

RCT_REMAP_METHOD(freeze, freezeForOwner:(NSString *)owner revision:(nonnull NSNumber *)revision
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    if (![owner isKindOfClass:[NSString class]]
            || ![revision isKindOfClass:[NSNumber class]]
            || CFGetTypeID((__bridge CFTypeRef)revision) == CFBooleanGetTypeID()
            || revision.doubleValue != revision.unsignedIntegerValue) {
        reject(@"invalid_selection", @"Background owner is required", nil);
        return;
    }
    [JitsiBackgroundEffects freezeOwner:owner revision:revision.unsignedIntegerValue];
    resolve(nil);
}

RCT_REMAP_METHOD(endSession, endSessionForOwner:(NSString *)owner revision:(nonnull NSNumber *)revision session:(nonnull NSNumber *)session
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    if (![owner isKindOfClass:[NSString class]]
            || ![revision isKindOfClass:[NSNumber class]]
            || CFGetTypeID((__bridge CFTypeRef)revision) == CFBooleanGetTypeID()
            || revision.doubleValue != revision.unsignedIntegerValue
            || ![session isKindOfClass:[NSNumber class]]
            || CFGetTypeID((__bridge CFTypeRef)session) == CFBooleanGetTypeID()
            || session.unsignedIntegerValue == 0
            || session.doubleValue != session.unsignedIntegerValue) {
        reject(@"invalid_selection", @"Background owner and session are required", nil);
        return;
    }
    [JitsiBackgroundEffects endSession:session.unsignedIntegerValue owner:owner revision:revision.unsignedIntegerValue];
    resolve(nil);
}

RCT_REMAP_METHOD(select, selectForOwner:(NSString *)owner revision:(nonnull NSNumber *)revision
                 selection:(NSDictionary *)selection
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    if (![owner isKindOfClass:[NSString class]]
            || ![revision isKindOfClass:[NSNumber class]]
            || CFGetTypeID((__bridge CFTypeRef)revision) == CFBooleanGetTypeID()
            || revision.doubleValue != revision.unsignedIntegerValue
            || ![selection isKindOfClass:[NSDictionary class]] || selection.count != 2) {
        reject(@"invalid_selection", @"Expected a sessionId and a bundled choice", nil);
        return;
    }
    NSNumber *sessionId = selection[@"sessionId"];
    NSString *choice = selection[@"choice"];
    if (![sessionId isKindOfClass:[NSNumber class]]
            || ![choice isKindOfClass:[NSString class]]
            || CFGetTypeID((__bridge CFTypeRef)sessionId) == CFBooleanGetTypeID()
            || sessionId.unsignedIntegerValue == 0
            || sessionId.doubleValue != sessionId.unsignedIntegerValue) {
        reject(@"invalid_selection", @"Expected a sessionId and a bundled choice", nil);
        return;
    }

    JitsiBackgroundEffectMode mode = JitsiBackgroundEffectModeNone;
    UIImage *image = nil;
    if ([choice isEqualToString:@"blur-light"]) {
        mode = JitsiBackgroundEffectModeBlurLight;
    } else if ([choice isEqualToString:@"blur"]) {
        mode = JitsiBackgroundEffectModeBlur;
    } else if (![choice isEqualToString:@"none"]) {
        NSDictionary *preset = nil;
        for (NSDictionary *candidate in [JitsiBackgroundEffectsModule presets]) {
            if ([candidate[@"id"] isEqualToString:choice]) {
                preset = candidate;
                break;
            }
        }
        image = preset ? [UIImage imageWithContentsOfFile:[NSURL URLWithString:preset[@"uri"]].path] : nil;
        if (!image) {
            reject(@"invalid_choice", @"Choice is not an available bundled background", nil);
            return;
        }
        mode = JitsiBackgroundEffectModeImage;
    }

    NSUInteger session = sessionId.unsignedIntegerValue;
    @synchronized([JitsiBackgroundEffects class]) {
        if (![JitsiBackgroundEffects isOwnerCurrent:owner revision:revision.unsignedIntegerValue]) {
            reject(@"stale_session", @"Background owner is no longer active", nil);
            return;
        }
        if (![JitsiBackgroundEffects selectMode:mode backgroundImage:image choice:choice session:session]) {
            BOOL stale = [[JitsiBackgroundEffects curatedState][@"sessionId"] unsignedIntegerValue] != session;
            reject(stale ? @"stale_session" : @"invalid_choice",
                   stale ? @"Background session is no longer active" : @"Bundled background cannot be applied", nil);
            return;
        }
        resolve([JitsiBackgroundEffectsModule state]);
    }
}

+ (NSDictionary *)state {
    NSMutableDictionary *state = [[JitsiBackgroundEffects curatedState] mutableCopy];
    state[@"presets"] = [self presets];
    return state;
}

+ (NSURL *)catalogDirectory {
    NSBundle *bundle = [NSBundle bundleForClass:self];
    return [bundle URLForResource:@"virtual-background" withExtension:nil];
}

+ (NSArray<NSDictionary *> *)presets {
    static NSArray<NSDictionary *> *cachedPresets;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSURL *directory = [self catalogDirectory];
        NSURL *catalogURL = [[NSBundle bundleForClass:self] URLForResource:@"virtual-backgrounds" withExtension:@"json"];
        NSData *data = catalogURL ? [NSData dataWithContentsOfURL:catalogURL] : nil;
        NSArray *catalog = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
        NSMutableArray<NSDictionary *> *items = [NSMutableArray array];
        NSMutableSet<NSString *> *ids = [NSMutableSet setWithArray:@[ @"none", @"blur", @"blur-light" ]];
        if ([catalog isKindOfClass:[NSArray class]]) {
            for (id entry in catalog) {
                if (![entry isKindOfClass:[NSDictionary class]]) {
                    continue;
                }
                NSString *identifier = entry[@"id"];
                NSString *title = entry[@"title"];
                NSString *file = entry[@"file"];
                if (![identifier isKindOfClass:[NSString class]] || !identifier.length
                        || [ids containsObject:identifier]
                        || ![title isKindOfClass:[NSString class]] || !title.length
                        || ![file isKindOfClass:[NSString class]] || !file.length
                        || ![file.lastPathComponent isEqualToString:file]
                        || ![@[ @"png", @"jpg", @"jpeg" ] containsObject:file.pathExtension.lowercaseString]) {
                    continue;
                }
                NSURL *url = [directory URLByAppendingPathComponent:file];
                if (![[NSFileManager defaultManager] fileExistsAtPath:url.path]) {
                    continue;
                }
                [items addObject:@{ @"id": identifier, @"title": title, @"uri": url.absoluteString }];
                [ids addObject:identifier];
            }
        }
        cachedPresets = [items copy];
    });
    return cachedPresets;
}

@end
