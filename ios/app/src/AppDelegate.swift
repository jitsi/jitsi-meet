import UIKit
import Firebase
import JitsiMeetSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        self.window = UIWindow(frame: UIScreen.main.bounds)

        let jitsiMeet = JitsiMeet.sharedInstance()

        // jitsiMeet.webRtcLoggingSeverity = .verbose

        jitsiMeet.conferenceActivityType = "org.jitsi.JitsiMeet.ios.conference" // Must match the one defined in Info.plist{}
        jitsiMeet.customUrlScheme = "org.jitsi.meet"
        jitsiMeet.universalLinkDomains = ["meet.jit.si", "alpha.jitsi.net", "beta.meet.jit.si"]

        jitsiMeet.defaultConferenceOptions = JitsiMeetConferenceOptions.fromBuilder { builder in
            // For testing configOverrides a room needs to be set
            // builder.room = "https://meet.jit.si/test0988test"

            builder.setFeatureFlag("welcomepage.enabled", withBoolean: true)
            builder.setFeatureFlag("ios.screensharing.enabled", withBoolean: true)
            builder.setFeatureFlag("ios.recording.enabled", withBoolean: true)
        }

        jitsiMeet.application(application, didFinishLaunchingWithOptions: launchOptions ?? [:])

        if self.appContainsRealServiceInfoPlist() {
            print("Enabling Firebase")
            FirebaseApp.configure()
            Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(!jitsiMeet.isCrashReportingDisabled())
        }

        let vc = ViewController()
        self.window?.rootViewController = vc
        jitsiMeet.showSplashScreen(vc.view)

        self.window?.makeKeyAndVisible()

        return true
    }

    func applicationWillTerminate(_ application: UIApplication) {
        print("Application will terminate!")
        if let rootController = self.window?.rootViewController as? ViewController {
            rootController.terminate()
        }
    }

    // MARK: Linking delegate methods

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        if self.appContainsRealServiceInfoPlist() {
            let handled = DynamicLinks.dynamicLinks().handleUniversalLink(userActivity.webpageURL!) { dynamicLink, error in
                if let firebaseUrl = self.extractURL(from: dynamicLink) {
                    userActivity.webpageURL = firebaseUrl
                    JitsiMeet.sharedInstance().application(application, continue: userActivity, restorationHandler: restorationHandler)
                }
            }

            if handled {
                return handled
            }
        }

        return JitsiMeet.sharedInstance().application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if url.absoluteString.contains("google/link/?dismiss=1&is_weak_match=1") {
            return false
        }

        var openUrl = url

        if self.appContainsRealServiceInfoPlist() {
            if let dynamicLink = DynamicLinks.dynamicLinks().dynamicLink(fromCustomSchemeURL: url),
               let firebaseUrl = self.extractURL(from: dynamicLink) {
                openUrl = firebaseUrl
            }
        }

        return JitsiMeet.sharedInstance().application(app, open: openUrl, options: options)
    }

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return JitsiMeet.sharedInstance().application(application, supportedInterfaceOrientationsFor: window)
    }
}

// Firebase utilities
extension AppDelegate {
    func appContainsRealServiceInfoPlist() -> Bool {
        return InfoPlistUtil.containsRealServiceInfoPlist(in: Bundle.main)
    }

    func extractURL(from dynamicLink: DynamicLink?) -> URL? {
        guard let dynamicLink = dynamicLink,
              let dynamicLinkURL = dynamicLink.url,
              dynamicLink.matchType == .unique || dynamicLink.matchType == .default else {
            return nil
        }
        return dynamicLinkURL
    }
}
