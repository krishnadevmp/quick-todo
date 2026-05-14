import { Download, Share, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import Button from "@/components/ui/Button";

// Detect iOS Safari (no beforeinstallprompt support)
function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  // Safari on iOS doesn't set "CriOS" or "FxiOS" (those are Chrome/Firefox on iOS)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua);
  return isIos && isSafari;
}

function isInStandaloneMode() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/** Opens the native share sheet — iOS shows "Add to Home Screen" inside it */
async function triggerShare() {
  if (typeof navigator === "undefined" || !navigator.share) return;
  try {
    await navigator.share({
      title: document.title,
      url: window.location.href,
    });
  } catch {
    // User dismissed the sheet (AbortError) — silently ignore
  }
}

export default function InstallBanner() {
  // isDismissed is reactive — managed by useLocalStorage inside useInstallPrompt
  const { canInstall, install, dismiss, isDismissed } = useInstallPrompt();
  const ios = isIosSafari();
  const standalone = isInStandaloneMode();
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  // Chrome/Android: use native prompt
  if (canInstall) {
    return (
      <div style={bannerStyle}>
        <IconBox>
          <Download size={14} color="#fff" />
        </IconBox>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleStyle}>Install Quick Todo</div>
          <div style={subtitleStyle}>Add to home screen for instant access</div>
        </div>
        <Button variant="primary" size="sm" onClick={install}>
          Install
        </Button>
        <DismissBtn onClick={dismiss} />
      </div>
    );
  }

  // iOS / any browser that supports Web Share: guide user to "Add to Home Screen"
  if (ios && !standalone && !isDismissed) {
    return (
      <div style={bannerStyle}>
        <IconBox
          onClick={canShare ? triggerShare : undefined}
          title={canShare ? "Open share menu" : undefined}
        >
          <Share size={14} color="#fff" />
        </IconBox>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleStyle}>Add to Home Screen</div>
          <div style={subtitleStyle}>
            {canShare ? (
              <>
                Tap <strong style={{ color: "var(--accent)" }}>Share</strong>{" "}
                then{" "}
                <strong style={{ color: "var(--accent)" }}>
                  "Add to Home Screen"
                </strong>
              </>
            ) : (
              <>
                Open the browser menu and choose{" "}
                <strong style={{ color: "var(--accent)" }}>
                  "Add to Home Screen"
                </strong>
              </>
            )}
          </div>
        </div>
        <DismissBtn onClick={dismiss} />
      </div>
    );
  }

  return null;
}

// ── Shared sub-components ─────────────────────────────────────────────────

function IconBox({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  if (onClick) {
    return (
      <Button
        variant="primary"
        iconOnly
        size="md"
        onClick={onClick}
        title={title}
      >
        {children}
      </Button>
    );
  }
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function DismissBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      iconOnly
      size="sm"
      onClick={onClick}
      title="Dismiss"
      style={{ color: "var(--text-placeholder)" }}
    >
      <X size={14} />
    </Button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const bannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 16px",
  background:
    "linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.08) 100%)",
  borderBottom: "1px solid rgba(99,102,241,0.25)",
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-primary)",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-sub)",
};
