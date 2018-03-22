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

/// Alias defining a completion closure that returns a Bool
public typealias CompletionAction = (Bool) -> Void

/// A window that allows its root view controller to be presented
/// in full screen or in a custom Picture in Picture mode
open class PiPWindow: UIWindow {
    
    /// Limits the boundries of root view position on screen when minimized
    public var dragBoundInsets: UIEdgeInsets = UIEdgeInsets(top: 25,
                                                            left: 5,
                                                            bottom: 5,
                                                            right: 5) {
        didSet {
            dragController.insets = dragBoundInsets
        }
    }
    
    /// The size ratio for root view controller view when in PiP mode
    public var pipSizeRatio: CGFloat = {
        let deviceIdiom = UIScreen.main.traitCollection.userInterfaceIdiom
        switch (deviceIdiom) {
        case .pad:
            return 0.25
        case .phone:
            return 0.33
        default:
            return 0.25
        }
    }()
    
    /// The PiP state of this contents of the window
    private(set) var isInPiP: Bool = false
    
    private let dragController: DragGestureController = DragGestureController()
    
    /// Used when in PiP mode to enable/disable exit PiP UI
    private var tapGestureRecognizer: UITapGestureRecognizer?
    private var exitPiPButton: UIButton?
    
    /// Help out to bubble up the gesture detection outside of the rootVC frame
    open override func point(inside point: CGPoint,
                             with event: UIEvent?) -> Bool {
        guard let vc = rootViewController else {
            return super.point(inside: point, with: event)
        }
        return vc.view.frame.contains(point)
    }
    
    /// animate in the window
    open func show(completion: CompletionAction? = nil) {
        if self.isHidden || self.alpha < 1 {
            self.isHidden = false
            self.alpha = 0
            
            animateTransition(animations: {
                self.alpha = 1
            }, completion: completion)
        }
    }
    
    /// animate out the window
    open func hide(completion: CompletionAction? = nil) {
        if !self.isHidden || self.alpha > 0 {
            animateTransition(animations: {
                self.alpha = 1
            }, completion: completion)
        }
    }
    
    /// Resize the root view to PiP mode
    open func enterPictureInPicture() {
        guard let view = rootViewController?.view else { return }
        isInPiP = true
        animateRootViewChange()
        dragController.startDragListener(inView: view)
        dragController.insets = dragBoundInsets
        
        // add single tap gesture recognition for displaying exit PiP UI
        let exitSelector = #selector(toggleExitPiP)
        let tapGestureRecognizer = UITapGestureRecognizer(target: self,
                                                          action: exitSelector)
        self.tapGestureRecognizer = tapGestureRecognizer
        view.addGestureRecognizer(tapGestureRecognizer)
    }
    
    /// Resize the root view to full screen
    open func exitPictureInPicture() {
        isInPiP = false
        animateRootViewChange()
        dragController.stopDragListener()
        
        // hide PiP UI
        exitPiPButton?.removeFromSuperview()
        exitPiPButton = nil
        
        // remove gesture
        let exitSelector = #selector(toggleExitPiP)
        tapGestureRecognizer?.removeTarget(self, action: exitSelector)
        tapGestureRecognizer = nil
    }
    
    /// Stop the dragging gesture of the root view
    public func stopDragGesture() {
        dragController.stopDragListener()
    }
    
    /// Customize the presentation of exit pip button
    open func configureExitPiPButton(target: Any,
                                     action: Selector) -> UIButton {
        let buttonImage = UIImage.init(named: "image-resize",
                                       in: Bundle(for: type(of: self)),
                                       compatibleWith: nil)
        let button = UIButton(type: .custom)
        let size: CGSize = CGSize(width: 44, height: 44)
        button.setImage(buttonImage, for: .normal)
        button.backgroundColor = .gray
        button.layer.cornerRadius = size.width / 2
        button.frame = CGRect(origin: CGPoint.zero, size: size)
        if let view = rootViewController?.view {
            button.center = view.convert(view.center, from:view.superview)
        }
        button.addTarget(target, action: action, for: .touchUpInside)
        return button
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
    
    // MARK: - Exit PiP
    
    @objc private func toggleExitPiP() {
        guard let view = rootViewController?.view else { return }
        
        if exitPiPButton == nil {
            // show button
            let exitSelector = #selector(exitPictureInPicture)
            let button = configureExitPiPButton(target: self,
                                                action: exitSelector)
            view.addSubview(button)
            exitPiPButton = button
            
        } else {
            // hide button
            exitPiPButton?.removeFromSuperview()
            exitPiPButton = nil
        }
    }
    
    @objc private func exitPiP() {
        exitPictureInPicture()
    }
    
    // MARK: - Animation transition
    
    private func animateTransition(animations: @escaping () -> Void,
                                   completion: CompletionAction?) {
        UIView.animate(withDuration: 0.1,
                       delay: 0,
                       options: .beginFromCurrentState,
                       animations: animations,
                       completion: completion)
    }
}
