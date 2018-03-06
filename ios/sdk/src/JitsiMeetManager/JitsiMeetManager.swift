//  Copyright © 2018 Jitsi. All rights reserved.

import Foundation

/// Creates and present a JitsiMeetView inside of an external window that can be dragged
/// when minimized (if PiP mode is enabled)
open class JitsiMeetManager: NSObject {
    
    /// The Jitsi meet view delegate
    public weak var delegate: JitsiMeetViewDelegate? = nil
    /// Limits the boundries of meet view position on screen when minimized
    public var dragBoundInsets: UIEdgeInsets = UIEdgeInsets(top: 25, left: 5, bottom: 5, right: 5)
    /// Enables PiP mode for this jitsiMeet
    public var allowPiP: Bool = true
    /// The size ratio for jitsiMeetView when in PiP mode
    public var pipSizeRatio: CGFloat = 0.333
    /// Defines if welcome screen should be on
    public var welcomeScreenEnabled: Bool = false
    
    fileprivate let dragController: DragGestureController = DragGestureController()
    
    fileprivate lazy var meetViewController: JitsiMeetViewController = { return self.makeMeetViewController() }()
    fileprivate lazy var meetWindow: JitsiMeetWindow = { return self.makeMeetWindow() }()
    fileprivate var meetingInPiP: Bool = false
    
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
    
    // MARK: - Manage PiP switching
    
    // update size animation
    fileprivate func updateMeetViewSize(isPiP: Bool) {
        UIView.animate(withDuration: 0.25) {
            self.meetViewController.view.frame = self.meetViewRect(isPiP: isPiP)
            self.meetViewController.view.setNeedsLayout()
        }
    }

    private func meetViewRect(isPiP: Bool) -> CGRect {
        guard isPiP else {
            return meetWindow.bounds
        }
        let bounds = meetWindow.bounds

        // resize to suggested ratio and position to the bottom right
        let adjustedBounds = UIEdgeInsetsInsetRect(bounds, dragBoundInsets)
        let size = CGSize(width: bounds.size.width * pipSizeRatio,
                          height: bounds.size.height * pipSizeRatio)
        let x: CGFloat = adjustedBounds.maxX - size.width
        let y: CGFloat = adjustedBounds.maxY - size.height
        return CGRect(x: x, y: y, width: size.width, height: size.height)
    }
    
    // MARK: - helpers
    
    fileprivate func cleanUp() {
        // TODO: more clean up work on this
        
        dragController.stopDragListener()
        meetWindow.isHidden = true
    }
    
    private func makeMeetViewController() -> JitsiMeetViewController {
        let vc = JitsiMeetViewController()
        vc.jitsiMeetView.delegate = self
        vc.jitsiMeetView.welcomePageEnabled = self.welcomeScreenEnabled
        vc.jitsiMeetView.pictureInPictureEnabled = self.allowPiP
        return vc
    }
    
    private func makeMeetWindow() -> JitsiMeetWindow {
        let window = JitsiMeetWindow(frame: UIScreen.main.bounds)
        window.backgroundColor = .clear
        window.windowLevel = UIWindowLevelStatusBar + 100
        window.rootViewController = self.meetViewController
        return window
    }
}

extension JitsiMeetManager: JitsiMeetViewDelegate {
    
    public func conferenceWillJoin(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.conferenceWillJoin!(data)
        }
    }

    public func conferenceJoined(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.conferenceJoined!(data)
        }
    }
    
    public func conferenceWillLeave(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.conferenceWillLeave!(data)
        }
    }

    public func conferenceLeft(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.cleanUp()
            
            self.delegate?.conferenceLeft!(data)
        }
    }
    
    public func conferenceFailed(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.cleanUp()

            self.delegate?.conferenceFailed!(data)
        }
    }
    
    public func loadConfigError(_ data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.delegate?.loadConfigError!(data)
        }
    }
    
    public func enterPicture(inPicture data: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.dragController.startDragListener(inView: self.meetViewController.view)
            self.dragController.insets = self.dragBoundInsets
            
            self.meetingInPiP = true
            self.updateMeetViewSize(isPiP: true)
            
            self.delegate?.enterPicture!(inPicture: data)
        }
    }
}
