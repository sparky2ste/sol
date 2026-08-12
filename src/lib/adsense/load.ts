const scriptPromises = new Map<string, Promise<void>>();

function scriptAlreadyLoaded(script: HTMLScriptElement): boolean {
  return (
    script.dataset.loaded === "true" ||
    script.getAttribute("data-loaded") === "true" ||
    Boolean(window.adsbygoogle)
  );
}

/** Load the AdSense script once per URL. */
export function loadAdSenseScript(scriptUrl: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const cached = scriptPromises.get(scriptUrl);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`
    );

    if (existing) {
      if (scriptAlreadyLoaded(existing)) {
        finish();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => fail(new Error("AdSense script failed")),
        { once: true }
      );
      // Script may have finished loading before listeners were attached.
      window.setTimeout(() => {
        if (window.adsbygoogle) finish();
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = scriptUrl;
    script.crossOrigin = "anonymous";
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      finish();
    };
    script.onerror = () => fail(new Error("AdSense script failed"));
    document.head.appendChild(script);
  });

  scriptPromises.set(scriptUrl, promise);
  return promise;
}

export function pushAdUnit(): boolean {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    return true;
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}
