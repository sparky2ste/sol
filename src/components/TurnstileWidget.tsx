"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import {
  TURNSTILE_ACTION_SCAN,
  getTurnstileSiteKey,
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
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  }, [onToken, onExpire]);

  const removeWidget = useCallback(() => {
    const turnstile = window.turnstile;
    const widgetId = widgetIdRef.current;

    if (widgetId && turnstile) {
      try {
        turnstile.remove(widgetId);
      } catch {
        // Widget may already be gone after unmount or expiry.
      }
    }

    widgetIdRef.current = null;
    containerRef.current?.replaceChildren();
  }, []);

  const renderWidget = useCallback(() => {
    const turnstile = window.turnstile;
    const container = containerRef.current;
    if (!container || !turnstile) return;

    removeWidget();

    const sitekey = getTurnstileSiteKey(window.location.hostname);

    widgetIdRef.current = turnstile.render(container, {
      sitekey,
      action: TURNSTILE_ACTION_SCAN,
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => {
        widgetIdRef.current = null;
        onExpireRef.current?.();
      },
      "error-callback": () => {
        widgetIdRef.current = null;
        onExpireRef.current?.();
      },
    });
  }, [removeWidget]);

  useEffect(() => {
    renderWidget();
  }, [resetKey, renderWidget]);

  useEffect(() => () => removeWidget(), [removeWidget]);

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
