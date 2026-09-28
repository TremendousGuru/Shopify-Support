"use client";

import { useEffect, useState } from "react";
import { BellRing, CircleAlert, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";

type GateStatus = "checking" | "permission" | "denied" | "unsupported" | "configuration" | "error" | "ready";

type PushConfiguration = {
  configured: boolean;
  publicKey: string | null;
};

async function getPushConfiguration(): Promise<PushConfiguration> {
  const response = await fetch("/api/push-subscriptions", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not check notification setup.");
  return response.json();
}

function decodeApplicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Could not save this device for notifications.");
  }
}

function supportsDevicePush() {
  return window.isSecureContext && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

async function inspectDeviceAccess(): Promise<{ status: GateStatus; message?: string }> {
  if (!supportsDevicePush()) return { status: "unsupported" };

  const configuration = await getPushConfiguration();
  if (!configuration.configured || !configuration.publicKey) return { status: "configuration" };
  if (Notification.permission === "denied") return { status: "denied" };
  if (Notification.permission !== "granted") return { status: "permission" };

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return { status: "permission" };

  await saveSubscription(subscription);
  return { status: "ready" };
}

async function enableDeviceAccess() {
  if (!supportsDevicePush()) return { status: "unsupported" as const };

  const configuration = await getPushConfiguration();
  if (!configuration.configured || !configuration.publicKey) return { status: "configuration" as const };

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: permission === "denied" ? "denied" as const : "permission" as const };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription()
    || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(configuration.publicKey),
    });

  await saveSubscription(subscription);
  return { status: "ready" as const };
}

export function NotificationGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    inspectDeviceAccess()
      .then((result) => {
        if (mounted) {
          setStatus(result.status);
          setMessage(result.message || "");
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Could not verify this device.");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await enableDeviceAccess();
      setStatus(result.status);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not enable device notifications.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "ready") return children;

  const denied = status === "denied";
  const unsupported = status === "unsupported";
  const configurationMissing = status === "configuration";
  const heading = status === "checking"
    ? "Checking this device"
    : denied
      ? "Allow notifications in your browser"
      : unsupported
        ? "A push-capable browser is required"
        : configurationMissing
          ? "Device alerts are not configured"
          : status === "error"
            ? "We couldn’t verify this device"
            : "Enable device notifications to continue";

  const description = status === "checking"
    ? "We’re verifying that this browser is ready for support alerts."
    : denied
      ? "Notifications are blocked for this site. Change the site permission in your browser settings, then check again."
      : unsupported
        ? "This portal requires browser notifications. Open it in a secure, up-to-date browser that supports push notifications."
        : configurationMissing
          ? "The support team needs to finish configuring device alerts before this portal can be used."
          : status === "error"
            ? message || "Check your connection and try again."
            : "Allow this site to send ticket and support updates to this device. You can continue once the device is subscribed.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f2] px-5 py-12 text-[#17211d]">
      <section className="w-full max-w-lg rounded-xl border border-[#dfe4dc] bg-white p-6 shadow-[0_18px_55px_-38px_rgba(19,43,31,0.42)] sm:p-9">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-[#e5f1df] text-[#16845f]">
          {status === "checking" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : denied || unsupported || configurationMissing || status === "error" ? <CircleAlert className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#16845f]">Shopify Support</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-[#17211d]">{heading}</h1>
        <p className="mt-3 text-sm leading-6 text-[#626d65]">{description}</p>
        {status === "error" && message && message !== description && (
          <p className="mt-3 rounded-lg bg-[#f7f7f2] px-3 py-2 text-xs text-[#626d65]">{message}</p>
        )}
        <div className="mt-7 flex flex-col gap-3">
          {!unsupported && !configurationMissing && status !== "checking" && (
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#16845f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c6347] disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : denied || status === "error" ? <RefreshCw className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {busy ? "Checking device…" : denied || status === "error" ? "Check again" : "Allow notifications and continue"}
            </button>
          )}
          {status === "checking" && <p className="flex items-center gap-2 text-xs text-[#758078]"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Checking notification access</p>}
        </div>
      </section>
    </main>
  );
}