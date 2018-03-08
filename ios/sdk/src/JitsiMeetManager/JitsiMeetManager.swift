//  Copyright © 2018 Jitsi. All rights reserved.

import Foundation

/// Creates and coordinates the presentation of JitsiMeetViewController inside of an external window
/// which can be resized and dragged with custom PiP mode
open class JitsiMeetManager: NSObject {
    
    /// Defines if welcome screen should be on
    public var welcomeScreenEnabled: Bool = false {
        didSet {
            meetViewController.jitsiMeetView.welcomePageEnabled = welcomeScreenEnabled
        }
    }
    
    fileprivate lazy var meetViewController: JitsiMeetViewController = { return self.makeMeetViewController() }()
    fileprivate lazy var meetWindow: PiPWindow = { return self.makeMeetWindow() }()
    
    /// Presents and loads a jitsi meet view
    ///
    /// - Parameter url: The url of the presentation
    public func load(withUrl url: URL?) {
        meetWindow.show()
        meetViewController.jitsiMeetView.load(url)
    }
    
    /// Presents and loads a jitsi meet view with configuration
    ///
    /// - Parameter urlObject: A dictionary of keys to be used for configuration
    public func load(withUrlObject urlObject: [AnyHashable : Any]?) {
        meetWindow.show()
        meetViewController.jitsiMeetView.loadURLObject(urlObject)
    }
    
    deinit {
        cleanUp()
    }
    
    // MARK: - helpers
    
    fileprivate func cleanUp() {
        // TODO: more clean up work on this
        
        meetWindow.isHidden = true
        meetWindow.stopDragGesture()
    }
    
    private func makeMeetViewController() -> JitsiMeetViewController {
        let vc = JitsiMeetViewController()
        vc.jitsiMeetView.welcomePageEnabled = self.welcomeScreenEnabled
        vc.jitsiMeetView.pictureInPictureEnabled = true
        vc.delegate = self
        return vc
    }
    
    private func makeMeetWindow() -> PiPWindow {
        let window = PiPWindow(frame: UIScreen.main.bounds)
        window.backgroundColor = .clear
        window.windowLevel = UIWindowLevelStatusBar + 100
        window.rootViewController = self.meetViewController
        return window
    }
}

extension JitsiMeetManager: JitsiMeetViewControllerDelegate {
    
    open func performPresentationUpdate(to: JitsiMeetPresentationUpdate) {
        switch to {
        case .enterPiP:
            meetWindow.goToPiP()
        case .traitChange:
            // resize to full screen if rotation happens
            if meetWindow.isInPiP {
                meetWindow.goToFullScreen()
            }
        }
    }
    
    open func meetingStarted() {
        // do something
    }
    
    open func meetingEnded(wasFailure: Bool) {
        cleanUp()
    }
}

