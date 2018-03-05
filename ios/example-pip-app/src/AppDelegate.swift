//
//  AppDelegate.swift
//  ExampleAppUsingJitsiWithPiP
//
//  Created by Daniel Ornelas on 3/5/18.
//  Copyright © 2018 Atlassian Inc. All rights reserved.
//

import JitsiMeet

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey : Any]? = nil) -> Bool {
        guard let launchOptions = launchOptions else { return false }
        return JitsiMeetView.application(application, didFinishLaunchingWithOptions: launchOptions)
    }
    
    // MARK: - Linking delegate methods
    
    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([Any]?) -> Void) -> Bool {
        return JitsiMeetView.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    func application(_ application: UIApplication, open url: URL, sourceApplication: String?, annotation: Any) -> Bool {
        return JitsiMeetView.application(application, open: url, sourceApplication: sourceApplication, annotation: annotation)
    }

}

