import React, { useEffect, useRef, useState, useCallback } from "react";

interface CollapseProps {
    id?: string; // optional — pass one if you need SSR-stable id
    header: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    defaultOpen?: boolean; // uncontrolled
    isOpen?: boolean; // controlled
    onToggle?: (nextOpen: boolean) => void;
    duration?: number; // ms
    easing?: string;
}

const Collapse: React.FC<CollapseProps> = ({
    id,
    header,
    children,
    className = "",
    defaultOpen = false,
    isOpen,
    onToggle,
    duration = 300,
    easing = "ease",
}) => {
    const controlled = isOpen !== undefined;
    const [openState, setOpenState] = useState<boolean>(defaultOpen);
    const open = controlled ? !!isOpen : openState;

    // typed content ref so TS knows scrollHeight exists
    const contentRef = useRef<HTMLDivElement | null>(null);

    // height can be 'auto' or '<n>px'
    const [height, setHeight] = useState<string>(open ? "auto" : "0px");

    // generate a stable id per instance if the user didn't provide one
    // useRef initializer runs only once on mount, so id is stable across renders
    const generatedIdRef = useRef<string>(`collapse-${Math.random().toString(36).slice(2, 9)}`);
    const contentId = id ?? generatedIdRef.current;

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        if (open) {
            // expand: animate to measured px then set to auto after the transition
            const measured = `${el.scrollHeight}px`;
            setHeight(measured);

            const t = window.setTimeout(() => setHeight("auto"), duration);
            return () => clearTimeout(t);
        } else {
            // collapse: if currently auto -> set px first then to 0 (frames) so transition runs
            if (height === "auto") {
                const px = `${el.scrollHeight}px`;
                setHeight(px);
                requestAnimationFrame(() => requestAnimationFrame(() => setHeight("0px")));
            } else {
                setHeight("0px");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, duration]);

    const handleToggle = useCallback(() => {
        if (controlled) {
            onToggle?.(!isOpen);
        } else {
            setOpenState((prev) => {
                const next = !prev;
                onToggle?.(next);
                return next;
            });
        }
    }, [controlled, isOpen, onToggle]);

    return (
        <div className={`collapse ${open ? "collapse--open" : ""} ${className}`}>
            <button
                type="button"
                className="collapse__header"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={handleToggle}
            >
                <span className="collapse__title">{header}</span>
                <span className="collapse__icon" aria-hidden="true">
                    ▾
                </span>
            </button>

            <div
                id={contentId}
                className="collapse__content"
                ref={contentRef}
                style={{
                    height: height === "auto" ? undefined : height,
                    overflow: "hidden",
                    transition: `height ${duration}ms ${easing}`,
                }}
            >
                <div className="collapse__inner">{children}</div>
            </div>
        </div>
    );
};

export default Collapse;
