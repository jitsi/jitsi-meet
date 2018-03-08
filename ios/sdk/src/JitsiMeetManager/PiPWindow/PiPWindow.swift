//  Copyright © 2018 Jitsi. All rights reserved.

/// A window that allows its root view controller to be presented
/// in full screen or in a custom Picture in Picture mode
open class PiPWindow: UIWindow {
    
    /// Limits the boundries of root view position on screen when minimized
    public var dragBoundInsets: UIEdgeInsets = UIEdgeInsets(top: 25, left: 5, bottom: 5, right: 5) {
        didSet {
            dragController.insets = dragBoundInsets
        }
    }
    
    /// The size ratio for root view controller view when in PiP mode
    public var pipSizeRatio: CGFloat = 0.333
    
    /// The PiP state of this contents of the window
    private(set) var isInPiP: Bool = false
    
    private let dragController: DragGestureController = DragGestureController()
    
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
    
    /// Resize the root view to PiP mode
    open func goToPiP() {
        guard let view = rootViewController?.view else { return }
        isInPiP = true
        animateRootViewChange()
        dragController.startDragListener(inView: view)
        dragController.insets = dragBoundInsets
    }
    
    /// Resize the root view to full screen
    open func goToFullScreen() {
        isInPiP = false
        animateRootViewChange()
        dragController.stopDragListener()
    }
    
    /// Stop the dragging gesture of the root view
    public func stopDragGesture() {
        dragController.stopDragListener()
    }
    
    // MARK: - Manage presentation switching
    
    private func animateRootViewChange() {
        UIView.animate(withDuration: 0.25) {
            self.rootViewController?.view.frame = self.changeRootViewRect()
            self.rootViewController?.view.setNeedsLayout()
        }
    }
    
    private func changeRootViewRect() -> CGRect {
        guard isInPiP else {
            return self.bounds
        }
        
        // resize to suggested ratio and position to the bottom right
        let adjustedBounds = UIEdgeInsetsInsetRect(self.bounds, dragBoundInsets)
        let size = CGSize(width: bounds.size.width * pipSizeRatio,
                          height: bounds.size.height * pipSizeRatio)
        let x: CGFloat = adjustedBounds.maxX - size.width
        let y: CGFloat = adjustedBounds.maxY - size.height
        return CGRect(x: x, y: y, width: size.width, height: size.height)
    }
}
