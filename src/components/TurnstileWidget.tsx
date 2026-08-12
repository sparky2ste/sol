"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import {
  TURNSTILE_ACTION_SCAN,
  TURNSTILE_SITE_KEY,
} from "@/lib/turnstile/config";

type TurnstileWidgetId = string;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => TurnstileWidgetId;
      reset: (widgetId: TurnstileWidgetId) => void;
      remove: (widgetId: TurnstileWidgetId) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
  resetKey?: number;
}

export function TurnstileWidget({
  onToken,
  onExpire,
  resetKey = 0,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: TURNSTILE_ACTION_SCAN,
      callback: onToken,
      "expired-callback": () => {
        widgetIdRef.current = null;
        onExpire?.();
      },
      "error-callback": () => {
        widgetIdRef.current = null;
        onExpire?.();
      },
    });
  }, [onToken, onExpire]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }

    widgetIdRef.current = null;
    renderWidget();
  }, [resetKey, renderWidget]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div
        ref={containerRef}
        className="flex min-h-[65px] items-center justify-center"
        aria-label="Security verification"
      />
    </>
  );
}
