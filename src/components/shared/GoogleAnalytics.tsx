"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const measurementId = "G-LJ9LC25ZJR";

declare global {
  interface Window {
    dataLayer: IArguments[];
    gtag: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {"window.dataLayer = window.dataLayer || [];\n" +
          "function gtag(){window.dataLayer.push(arguments);}\n" +
          "window.gtag = window.gtag || gtag;\n" +
          "gtag('js', new Date());\n" +
          `gtag('config', '${measurementId}', { send_page_view: false });`}
      </Script>
    </>
  );
}
