/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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

import Foundation

/// Coordinates the presentation of JitsiMeetViewController inside of
/// an external window that can be resized and dragged with custom PiP mode
open class JitsiMeetPresentationCoordinator: NSObject {
    
    fileprivate let meetViewController: JitsiMeetViewController
    fileprivate let meetWindow: PiPWindow
    
    public init(meetViewController: JitsiMeetViewController? = nil,
                meetWindow: PiPWindow? = nil) {
        self.meetViewController = meetViewController ?? JitsiMeetViewController()
        self.meetWindow = meetWindow ?? PiPWindow(frame: UIScreen.main.bounds)
        
        super.init()
        
        configureMeetWindow()
        configureMeetViewController()
    }
    
    public func jitsiMeetView() -> JitsiMeetView {
        return meetViewController.jitsiMeetView
    }
    
    open func show(completion: CompletionAction? = nil) {
        meetWindow.show(completion: completion)
    }
    
    open func hide(completion: CompletionAction? = nil) {
        meetWindow.hide(completion: completion)
    }
    
    open func cleanUp() {
        // TODO: more clean up work on this
        
        meetWindow.isHidden = true
        meetWindow.stopDragGesture()
    }
    
    deinit {
        cleanUp()
    }
    
    // MARK: - helpers
    
    private func configureMeetViewController() {
        meetViewController.jitsiMeetView.pictureInPictureEnabled = true
        meetViewController.delegate = self
    }
    
    private func configureMeetWindow() {
        meetWindow.backgroundColor = .clear
        meetWindow.windowLevel = UIWindowLevelStatusBar + 100
        meetWindow.rootViewController = self.meetViewController
    }
}

extension JitsiMeetPresentationCoordinator: JitsiMeetViewControllerDelegate {
    
    open func performPresentationUpdate(to: JitsiMeetPresentationUpdate) {
        switch to {
        case .enterPictureInPicture:
            meetWindow.enterPictureInPicture()
        case .traitChange:
            // resize to full screen if rotation happens
            if meetWindow.isInPiP {
                meetWindow.exitPictureInPicture()
            }
        }
    }
    
    open func conferenceStarted() {
        if meetWindow.isHidden {
            meetWindow.show()
        }
    }
    
    open func conferenceEnded(didFail: Bool) {
        cleanUp()
    }
}
