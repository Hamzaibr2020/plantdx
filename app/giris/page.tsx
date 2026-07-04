"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Leaf, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export default function GirisPage() {
  const router = useRouter();
  const { setUsername } = useAuth();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "error" | "info"; message: string }>({
    type: "idle",
    message: "",
  });
  const [biometricSupported] = useState(() =>
    typeof window !== "undefined" && !!window.PublicKeyCredential
  );

  async function handleRegister() {
    if (!name.trim()) return setStatus({ type: "error", message: "Lütfen adını gir." });
    setStatus({ type: "loading", message: "Cihazının biyometrik sensörü açılıyor..." });
    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name.trim() }),
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error ?? "Kayıt seçenekleri alınamadı.");

      const attResp = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name.trim(), response: attResp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) throw new Error(verifyData.error ?? "Kayıt doğrulanamadı.");

      setStatus({ type: "info", message: "Biyometrik kayıt tamamlandı! Şimdi giriş yapabilirsin." });
      setMode("login");
    } catch (err) {
      setStatus({ type: "error", message: humanizeWebAuthnError(err) });
    }
  }

  async function handleLogin() {
    if (!name.trim()) return setStatus({ type: "error", message: "Lütfen adını gir." });
    setStatus({ type: "loading", message: "Parmak izi / yüz tanıma bekleniyor..." });
    try {
      const optRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name.trim() }),
      });
      const options = await optRes.json();
      if (!optRes.ok) {
        if (options.noCredentials) {
          setStatus({ type: "error", message: "Bu isimle kayıtlı biyometri yok. Önce kayıt ol." });
          setMode("register");
          return;
        }
        throw new Error(options.error ?? "Giriş seçenekleri alınamadı.");
      }

      const authResp = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name.trim(), response: authResp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) throw new Error(verifyData.error ?? "Giriş doğrulanamadı.");

      setUsername(name.trim());
      router.replace("/anasayfa");
    } catch (err) {
      setStatus({ type: "error", message: humanizeWebAuthnError(err) });
    }
  }

  function continueWithoutBiometric() {
    if (!name.trim()) return setStatus({ type: "error", message: "Lütfen adını gir." });
    setUsername(name.trim());
    router.replace("/anasayfa");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gradient-to-b from-brand-green-50 to-white dark:from-[#0f2318] dark:to-[#0b1410]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-green-600 flex items-center justify-center mb-3 leaf-float">
            <Leaf className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-brand-green-900 dark:text-white">PlantDX</h1>
          <p className="text-sm text-foreground/60 mt-1">Akıllı bitki sağlığı ve bahçe yönetimi</p>
        </div>

        <div className="glass-card p-5 flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adın (kullanıcı adı)"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/20 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green-500"
          />

          {biometricSupported ? (
            <>
              <button
                onClick={mode === "login" ? handleLogin : handleRegister}
                disabled={status.type === "loading"}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-green-600 hover:bg-brand-green-700 text-white py-3 font-medium transition disabled:opacity-60"
              >
                <Fingerprint size={20} />
                {mode === "login" ? "Parmak İzi / Yüz ile Giriş Yap" : "Biyometrik Kayıt Ol"}
              </button>
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-xs text-brand-green-700 dark:text-brand-green-400 underline self-center"
              >
                {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten kayıtlıyım, giriş yap"}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-warn-500 bg-warn-500/10 rounded-lg p-3">
              <ShieldCheck size={16} className="shrink-0" />
              Bu tarayıcı/cihaz biyometrik kimlik doğrulamayı (WebAuthn) desteklemiyor. Aşağıdan
              biyometri olmadan devam edebilirsin.
            </div>
          )}

          {status.type !== "idle" && (
            <p
              className={`text-xs text-center ${
                status.type === "error" ? "text-danger-500" : status.type === "info" ? "text-ok-500" : "text-foreground/60"
              }`}
            >
              {status.message}
            </p>
          )}

          <button
            onClick={continueWithoutBiometric}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 py-2.5 text-sm text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Biyometri olmadan devam et <ArrowRight size={14} />
          </button>
        </div>

        <p className="text-[11px] text-center text-foreground/40 mt-4">
          Parmak izi/yüz verin cihazından hiç çıkmaz — Apple/Google/Windows'un güvenli donanımında
          (Secure Enclave/TPM) kalır. PlantDX sadece doğrulama sonucunu alır.
        </p>
      </div>
    </div>
  );
}

function humanizeWebAuthnError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("NotAllowedError") || msg.toLowerCase().includes("cancel"))
    return "İşlem iptal edildi veya zaman aşımına uğradı.";
  if (msg.toLowerCase().includes("not registered") || msg.includes("kayıtlı"))
    return msg;
  return msg || "Beklenmeyen bir hata oluştu.";
}
