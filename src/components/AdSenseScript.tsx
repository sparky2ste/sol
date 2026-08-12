import Script from "next/script";
import { ADSENSE_SCRIPT } from "@/lib/adsense/config";

export function AdSenseScript() {
  return (
    <Script
      id="adsense-loader"
      async
      src={ADSENSE_SCRIPT}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
