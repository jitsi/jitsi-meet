//  Copyright © 2018 Jitsi. All rights reserved.

open class JitsiMeetWindow: UIWindow {
    
    /// Help out to bubble up the gesture detection outside of the rootVC frame
    open override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        guard let vc = rootViewController else {
            return super.point(inside: point, with: event)
        }
        return vc.view.frame.contains(point)
    }
    
    /// animate in the window
    open func show() {
        if self.isHidden || self.alpha < 1 {
            self.isHidden = false
            self.alpha = 0
            
            UIView.animate(
                withDuration: 0.1,
                delay: 0,
                options: .beginFromCurrentState,
                animations: {
                    self.alpha = 1
            },
                completion: nil)
        }
    }
    
    /// animate out the window
    open func hide() {
        if !self.isHidden || self.alpha > 0 {
            UIView.animate(
                withDuration: 0.1,
                delay: 0,
                options: .beginFromCurrentState,
                animations: {
                    self.alpha = 0
                    self.isHidden = true
            },
                completion: nil)
        }
    }
}

