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

import UIKit

final class DragGestureController {

    var insets: UIEdgeInsets = UIEdgeInsets.zero

    private var frameBeforeDragging: CGRect = CGRect.zero
    private weak var view: UIView?
    private lazy var panGesture: UIPanGestureRecognizer = {
        return UIPanGestureRecognizer(target: self,
                                      action: #selector(handlePan(gesture:)))
    }()

    func startDragListener(inView view: UIView) {
        self.view = view
        view.addGestureRecognizer(panGesture)
        panGesture.isEnabled = true
    }

    func stopDragListener() {
        panGesture.isEnabled = false
        view?.removeGestureRecognizer(panGesture)
        view = nil
    }

    @objc private func handlePan(gesture: UIPanGestureRecognizer) {
        guard let view = self.view else { return }

        let translation = gesture.translation(in: view.superview)
        let velocity = gesture.velocity(in: view.superview)
        var frame = frameBeforeDragging

        switch gesture.state {
        case .began:
            frameBeforeDragging = view.frame

        case .changed:
            frame.origin.x = floor(frame.origin.x + translation.x)
            frame.origin.y = floor(frame.origin.y + translation.y)
            view.frame = frame

        case .ended:
            let currentPos = view.frame.origin
            let finalPos = calculateFinalPosition()

            let distance = CGPoint(x: currentPos.x - finalPos.x,
                                   y: currentPos.y - finalPos.y)
            let distanceMagnitude = magnitude(vector: distance)
            let velocityMagnitude = magnitude(vector: velocity)
            let animationDuration = 0.5
            let initialSpringVelocity =
                velocityMagnitude / distanceMagnitude / CGFloat(animationDuration)

            frame.origin = CGPoint(x: finalPos.x, y: finalPos.y)

            UIView.animate(withDuration: animationDuration,
                           delay: 0,
                           usingSpringWithDamping: 0.9,
                           initialSpringVelocity: initialSpringVelocity,
                           options: .curveLinear,
                           animations: {
                            view.frame = frame
            }, completion: nil)

        default:
            break
        }
    }

    private func calculateFinalPosition() -> CGPoint {
        guard
            let view = self.view,
            let bounds = view.superview?.frame
            else { return CGPoint.zero }

        let currentSize = view.frame.size
        let adjustedBounds = bounds.inset(by: insets)
        let threshold: CGFloat = 20.0
        let velocity = panGesture.velocity(in: view.superview)
        let location = panGesture.location(in: view.superview)

        let goLeft: Bool
        if abs(velocity.x) > threshold {
            goLeft = velocity.x < -threshold
        } else {
            goLeft = location.x < bounds.midX
        }

        let goUp: Bool
        if abs(velocity.y) > threshold {
            goUp = velocity.y < -threshold
        } else {
            goUp = location.y < bounds.midY
        }

        let finalPosX: CGFloat =
            goLeft
                ? adjustedBounds.origin.x
                : bounds.size.width - insets.right  - currentSize.width
        let finalPosY: CGFloat =
            goUp
                ? adjustedBounds.origin.y
                : bounds.size.height - insets.bottom - currentSize.height

        return CGPoint(x: finalPosX, y: finalPosY)
    }

    private func magnitude(vector: CGPoint) -> CGFloat {
        return sqrt(pow(vector.x, 2) + pow(vector.y, 2))
    }
}
