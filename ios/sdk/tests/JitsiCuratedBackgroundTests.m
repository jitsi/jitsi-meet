#import <XCTest/XCTest.h>
#import <UIKit/UIKit.h>

#import "../src/JitsiBackgroundEffects+Private.h"

typedef void (^JitsiCuratedResolveBlock)(id result);
typedef void (^JitsiCuratedRejectBlock)(NSString *code, NSString *message, NSError *error);

@interface NSObject (JitsiCuratedBackgroundBridge)
- (void)getStateForOwner:(NSString *)owner revision:(NSNumber *)revision
                 resolver:(JitsiCuratedResolveBlock)resolve rejecter:(JitsiCuratedRejectBlock)reject;
- (void)beginSessionForOwner:(NSString *)owner revision:(NSNumber *)revision
                  resolver:(JitsiCuratedResolveBlock)resolve rejecter:(JitsiCuratedRejectBlock)reject;
- (void)selectForOwner:(NSString *)owner revision:(NSNumber *)revision selection:(NSDictionary *)selection
              resolver:(JitsiCuratedResolveBlock)resolve rejecter:(JitsiCuratedRejectBlock)reject;
@end

@interface JitsiCuratedBridgeResult : NSObject
@property(nonatomic, strong) NSDictionary *state;
@property(nonatomic, copy) NSString *errorCode;
@end

@implementation JitsiCuratedBridgeResult
@end

@interface JitsiCuratedBackgroundTests : XCTestCase
@property(nonatomic, copy) NSString *owner;
@property(nonatomic, strong) NSNumber *ownerRevision;
@end

@implementation JitsiCuratedBackgroundTests

- (void)setUp {
    [super setUp];
    [JitsiBackgroundEffects reset];
    self.owner = [NSUUID UUID].UUIDString;
    self.ownerRevision = @([JitsiBackgroundEffects claimOwner:self.owner]);
}

- (void)tearDown {
    [JitsiBackgroundEffects releaseOwner:self.owner];
    [JitsiBackgroundEffects reset];
    [super tearDown];
}

- (JitsiCuratedBridgeResult *)getState {
    return [self getStateForOwner:self.owner revision:self.ownerRevision];
}

- (JitsiCuratedBridgeResult *)getStateForOwner:(NSString *)owner revision:(NSNumber *)revision {
    JitsiCuratedBridgeResult *result = [JitsiCuratedBridgeResult new];
    Class moduleClass = NSClassFromString(@"JitsiBackgroundEffectsModule");
    id module = [[moduleClass alloc] init];
    XCTAssertNotNil(module);
    [module getStateForOwner:owner revision:revision resolver:^(id value) {
        if ([value isKindOfClass:[NSDictionary class]]) result.state = value;
    } rejecter:^(NSString *code, NSString *message, NSError *error) {
        result.errorCode = code;
    }];
    return result;
}

- (JitsiCuratedBridgeResult *)select:(id)selection {
    return [self selectForOwner:self.owner revision:self.ownerRevision selection:selection];
}

- (JitsiCuratedBridgeResult *)selectForOwner:(NSString *)owner revision:(NSNumber *)revision selection:(id)selection {
    JitsiCuratedBridgeResult *result = [JitsiCuratedBridgeResult new];
    Class moduleClass = NSClassFromString(@"JitsiBackgroundEffectsModule");
    id module = [[moduleClass alloc] init];
    XCTAssertNotNil(module);
    [module selectForOwner:owner revision:revision selection:selection resolver:^(id value) {
        if ([value isKindOfClass:[NSDictionary class]]) result.state = value;
    } rejecter:^(NSString *code, NSString *message, NSError *error) {
        result.errorCode = code;
    }];
    return result;
}

- (void)testCatalogContainsExactlySevenBundledDecodableImages {
    JitsiCuratedBridgeResult *result = [self getState];
    XCTAssertNil(result.errorCode);
    XCTAssertNotNil(result.state);
    if (!result.state) return;
    NSSet *actualStateKeys = [NSSet setWithArray:result.state.allKeys];
    NSSet *expectedStateKeys = [NSSet setWithArray:@[ @"sessionId", @"choice", @"status", @"presets" ]];
    XCTAssertEqualObjects(actualStateKeys, expectedStateKeys);
    NSArray *presets = result.state[@"presets"];
    XCTAssertEqual(presets.count, 7u);
    NSSet *expectedIDs = [NSSet setWithArray:@[
        @"1", @"2", @"3", @"4", @"5", @"6", @"7"
    ]];
    NSMutableSet *actualIDs = [NSMutableSet set];
    for (id preset in presets) {
        if (![preset isKindOfClass:[NSDictionary class]]) {
            XCTFail(@"Preset must be a dictionary: %@", preset);
            continue;
        }
        NSString *identifier = preset[@"id"];
        NSString *uriString = preset[@"uri"];
        XCTAssertTrue([identifier isKindOfClass:[NSString class]]);
        XCTAssertTrue([uriString isKindOfClass:[NSString class]]);
        if (![identifier isKindOfClass:[NSString class]] || ![uriString isKindOfClass:[NSString class]]) continue;
        [actualIDs addObject:identifier];
        NSURL *url = [NSURL URLWithString:uriString];
        XCTAssertTrue(url.isFileURL);
        if (!url.isFileURL) continue;
        XCTAssertTrue([[NSFileManager defaultManager] fileExistsAtPath:url.path]);
        UIImage *image = [UIImage imageWithContentsOfFile:url.path];
        XCTAssertNotNil(image.CGImage);
    }
    XCTAssertEqualObjects(actualIDs, expectedIDs);
}

- (void)testValidChoicesResolveChoiceAndNativeMode {
    NSUInteger session = [JitsiBackgroundEffects beginSession];
    NSArray *choices = @[
        @[ @"1", @(JitsiBackgroundEffectModeImage), @"processing" ],
        @[ @"2", @(JitsiBackgroundEffectModeImage), @"processing" ],
        @[ @"3", @(JitsiBackgroundEffectModeImage), @"processing" ],
        @[ @"4", @(JitsiBackgroundEffectModeImage), @"processing" ],
        @[ @"5", @(JitsiBackgroundEffectModeImage), @"processing" ],
        @[ @"6", @(JitsiBackgroundEffectModeImage), @"processing" ],
        @[ @"7", @(JitsiBackgroundEffectModeImage), @"processing" ],
        @[ @"blur-light", @(JitsiBackgroundEffectModeBlurLight), @"processing" ],
        @[ @"blur", @(JitsiBackgroundEffectModeBlur), @"processing" ],
        @[ @"none", @(JitsiBackgroundEffectModeNone), @"inactive" ]
    ];
    for (NSArray *choiceCase in choices) {
        NSString *choice = choiceCase[0];
        JitsiBackgroundEffectMode expectedMode = [choiceCase[1] unsignedIntegerValue];
        JitsiCuratedBridgeResult *result = [self select:@{ @"sessionId": @(session), @"choice": choice }];
        XCTAssertNil(result.errorCode);
        XCTAssertEqualObjects(result.state[@"sessionId"], @(session));
        XCTAssertEqualObjects(result.state[@"choice"], choice);
        XCTAssertEqualObjects(result.state[@"status"], choiceCase[2]);
        XCTAssertEqual([JitsiBackgroundEffects mode], expectedMode);
    }
}

- (void)testEndedSessionIsInactiveAndCannotSelect {
    NSUInteger session = [JitsiBackgroundEffects beginSession];
    [JitsiBackgroundEffects endSession:session];
    JitsiCuratedBridgeResult *before = [self getState];
    XCTAssertNil(before.errorCode);
    XCTAssertEqualObjects(before.state[@"sessionId"], @0);
    JitsiCuratedBridgeResult *selection = [self select:@{ @"sessionId": @(session), @"choice": @"none" }];
    XCTAssertNil(selection.state);
    XCTAssertEqualObjects(selection.errorCode, @"stale_session");
    XCTAssertEqualObjects([self getState].state, before.state);
}

- (void)testOldSessionCannotOverrideNewSelection {
    NSUInteger oldSession = [JitsiBackgroundEffects beginSession];
    JitsiCuratedBridgeResult *oldSelection = [self select:@{
        @"sessionId": @(oldSession), @"choice": @"1"
    }];
    XCTAssertNil(oldSelection.errorCode);
    NSUInteger newSession = [JitsiBackgroundEffects beginSession];
    JitsiCuratedBridgeResult *newSelection = [self select:@{
        @"sessionId": @(newSession), @"choice": @"blur"
    }];
    XCTAssertNil(newSelection.errorCode);
    JitsiCuratedBridgeResult *staleSelection = [self select:@{
        @"sessionId": @(oldSession), @"choice": @"none"
    }];
    XCTAssertNil(staleSelection.state);
    XCTAssertEqualObjects(staleSelection.errorCode, @"stale_session");
    NSDictionary *state = [self getState].state;
    XCTAssertEqualObjects(state[@"sessionId"], @(newSession));
    XCTAssertEqualObjects(state[@"choice"], @"blur");
    XCTAssertEqual([JitsiBackgroundEffects mode], JitsiBackgroundEffectModeBlur);
}

- (void)testUnknownAndExternalChoicesAreRejectedWithoutChangingState {
    NSUInteger session = [JitsiBackgroundEffects beginSession];
    JitsiCuratedBridgeResult *accepted = [self select:@{
        @"sessionId": @(session), @"choice": @"1"
    }];
    XCTAssertNil(accepted.errorCode);
    NSDictionary *before = [self getState].state;
    NSArray *invalidChoices = @[
        @"missing-preset", @"../1.png", @"https://example.com/background.jpg",
        @"data:image/png;base64,iVBORw0KGgo="
    ];
    for (NSString *choice in invalidChoices) {
        JitsiCuratedBridgeResult *result = [self select:@{ @"sessionId": @(session), @"choice": choice }];
        XCTAssertNil(result.state);
        XCTAssertEqualObjects(result.errorCode, @"invalid_choice");
        XCTAssertEqualObjects([self getState].state, before);
    }
}

- (void)testMalformedSessionArgumentsAreRejectedWithoutChangingState {
    NSUInteger session = [JitsiBackgroundEffects beginSession];
    JitsiCuratedBridgeResult *accepted = [self select:@{
        @"sessionId": @(session), @"choice": @"1"
    }];
    XCTAssertNil(accepted.errorCode);
    NSDictionary *before = [self getState].state;
    NSArray *malformedSelections = @[
        @{ @"choice": @"none" },
        @{ @"sessionId": @(session), @"choice": @"none", @"extra": @1 },
        @{ @"sessionId": @"1", @"choice": @"none" },
        @{ @"sessionId": @YES, @"choice": @"none" },
        @{ @"sessionId": @1.5, @"choice": @"none" }
    ];
    for (NSDictionary *selection in malformedSelections) {
        JitsiCuratedBridgeResult *result = [self select:selection];
        XCTAssertNil(result.state);
        XCTAssertEqualObjects(result.errorCode, @"invalid_selection");
        XCTAssertEqualObjects([self getState].state, before);
    }
}

- (JitsiCuratedBridgeResult *)beginSessionForOwner:(NSString *)owner revision:(NSNumber *)revision {
    JitsiCuratedBridgeResult *result = [JitsiCuratedBridgeResult new];
    id module = [[NSClassFromString(@"JitsiBackgroundEffectsModule") alloc] init];
    [module beginSessionForOwner:owner revision:revision resolver:^(id value) {
        if ([value isKindOfClass:[NSDictionary class]]) result.state = value;
    } rejecter:^(NSString *code, NSString *message, NSError *error) {
        result.errorCode = code;
    }];
    return result;
}

- (void)testOldPickerCannotReadOrChangeAnotherOwnersSession {
    JitsiCuratedBridgeResult *first = [self beginSessionForOwner:self.owner revision:self.ownerRevision];
    XCTAssertNil(first.errorCode);
    NSString *nextOwner = [NSUUID UUID].UUIDString;
    NSNumber *nextRevision = @([JitsiBackgroundEffects claimOwner:nextOwner]);
    JitsiCuratedBridgeResult *next = [self beginSessionForOwner:nextOwner revision:nextRevision];
    NSNumber *session = next.state[@"sessionId"];
    XCTAssertNotNil(session);
    XCTAssertNotEqualObjects(first.state[@"sessionId"], session);
    JitsiCuratedBridgeResult *selected = [self selectForOwner:nextOwner revision:nextRevision
                                                  selection:@{ @"sessionId": session, @"choice": @"blur" }];
    XCTAssertNil(selected.errorCode);
    JitsiCuratedBridgeResult *read = [self getState];
    XCTAssertNil(read.state);
    XCTAssertEqualObjects(read.errorCode, @"stale_session");
    JitsiCuratedBridgeResult *attempt = [self select:@{ @"sessionId": session, @"choice": @"none" }];
    XCTAssertNil(attempt.state);
    XCTAssertEqualObjects(attempt.errorCode, @"stale_session");
    JitsiCuratedBridgeResult *begin = [self beginSessionForOwner:self.owner revision:self.ownerRevision];
    XCTAssertNil(begin.state);
    XCTAssertEqualObjects(begin.errorCode, @"stale_session");
    JitsiCuratedBridgeResult *current = [self getStateForOwner:nextOwner revision:nextRevision];
    XCTAssertEqualObjects(current.state[@"sessionId"], session);
    XCTAssertEqualObjects(current.state[@"choice"], @"blur");
    [JitsiBackgroundEffects releaseOwner:nextOwner];
}

- (void)testRetiredPickerRevisionCannotReadOrMutateTheNewScope {
    NSNumber *oldRevision = self.ownerRevision;
    self.ownerRevision = @([JitsiBackgroundEffects advanceOwner:self.owner]);
    JitsiCuratedBridgeResult *next = [self beginSessionForOwner:self.owner revision:self.ownerRevision];
    NSNumber *session = next.state[@"sessionId"];
    XCTAssertNotNil(session);
    JitsiCuratedBridgeResult *read = [self getStateForOwner:self.owner revision:oldRevision];
    XCTAssertNil(read.state);
    XCTAssertEqualObjects(read.errorCode, @"stale_session");
    JitsiCuratedBridgeResult *attempt = [self selectForOwner:self.owner revision:oldRevision
                                                 selection:@{ @"sessionId": session, @"choice": @"blur" }];
    XCTAssertNil(attempt.state);
    XCTAssertEqualObjects(attempt.errorCode, @"stale_session");
    JitsiCuratedBridgeResult *current = [self getState];
    XCTAssertEqualObjects(current.state[@"sessionId"], session);
    XCTAssertEqualObjects(current.state[@"choice"], @"none");
}

@end
