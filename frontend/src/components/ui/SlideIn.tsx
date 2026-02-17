"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlideInProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: React.ReactNode;
  urlPath?: string;
  persistOnRefresh?: boolean;
}

const widthClasses = {
  sm: "w-full md:max-w-md",
  md: "w-full md:max-w-lg",
  lg: "w-full md:max-w-2xl",
  xl: "w-full md:max-w-4xl",
  full: "w-full md:max-w-full",
};

export function SlideIn({
  isOpen,
  onClose,
  title,
  children,
  width = "lg",
  footer,
  urlPath,
  persistOnRefresh = true,
}: SlideInProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (urlPath && persistOnRefresh && typeof window !== "undefined") {
      if (isOpen) {
        previousUrlRef.current =
          window.location.pathname + window.location.search;
        window.history.replaceState(null, "", urlPath);
      } else if (previousUrlRef.current) {
        window.history.replaceState(null, "", previousUrlRef.current);
        previousUrlRef.current = null;
      }
    }
  }, [isOpen, urlPath, persistOnRefresh]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        setIsShowing(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsShowing(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    setTimeout(() => {
      firstFocusable?.focus();
    }, 100);

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    panel.addEventListener("keydown", handleTabKey);
    return () => {
      panel.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isMounted) return null;

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "slide-in-title" : undefined}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-500 ease-out",
          isShowing ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        ref={panelRef}
        className={cn(
          "relative w-full bg-white dark:bg-gray-900 shadow-2xl",
          "h-[92vh] md:h-full",
          "rounded-t-2xl md:rounded-none",
          "transform transition-all duration-500",
          "flex flex-col",
          widthClasses[width],
          isShowing
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        )}
        style={{
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {title ? (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2
              id="slide-in-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="absolute top-4 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
