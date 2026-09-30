"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/store/appStore";
import {
  getChatHistory,
  saveMessage,
  getPromptCount,
  incrementPromptCount,
  clearChatHistory,
  sendChatMessage,
  AI_PROMPT_LIMIT,
  type ChatMessage,
} from "@/services/ai/chatService";
import { getSettings } from "@/services/database/settings";

const ADMIN_EMAIL = "callmejohnvick@gmail.com";

export default function AIPage() {
  const { currentUser, settings } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [resolvedApiKey, setResolvedApiKey] = useState<string | null>(null);
  const [pastedImages, setPastedImages] = useState<{ base64: string; mimeType: string; preview: string }[]>([]);
  const pastedImagesRef = useRef(pastedImages);
  pastedImagesRef.current = pastedImages;
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = currentUser?.id ?? "";
  const isAdmin = currentUser?.role === "admin";
  const isSpecial = currentUser?.role === "special";
  const isPrivileged = isAdmin || isSpecial; // unlimited prompts

  // Load history + usage count on mount
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const [history, count, s] = await Promise.all([
          getChatHistory(userId),
          getPromptCount(userId),
          getSettings(),
        ]);
        setMessages(history);
        setPromptCount(count);
        setLimitReached(count >= AI_PROMPT_LIMIT && !isPrivileged);
        // Resolve API key: settings first, fallback to env var
        const key = s.aiApiKey || process.env.NEXT_PUBLIC_AI_API_KEY || null;
        setResolvedApiKey(key);
      } catch (err) {
        console.error("AI init error:", err);
      } finally {
        setInitLoading(false);
      }
    })();
  }, [userId, isPrivileged]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && pastedImages.length === 0) || loading || (limitReached && !isPrivileged) || !userId) return;
    if (!resolvedApiKey) return;

    const userText = input.trim();
    const imagesSnapshot = [...pastedImages];
    setInput("");
    setPastedImages([]);
    setLoading(true);

    // Build display text for saved message
    let displayPrefix = "";
    if (imagesSnapshot.length > 0) {
      displayPrefix = imagesSnapshot.length === 1 ? "📷 Image" : `📷 ${imagesSnapshot.length} Images`;
    }
    const displayText = [displayPrefix, userText].filter(Boolean).join(" - ");

    try {
      // Optimistic user message
      const userMsg = await saveMessage(userId, "user", displayText);
      setMessages((prev) => [...prev, userMsg]);

      // Increment usage
      const newCount = await incrementPromptCount(userId);
      setPromptCount(newCount);
      if (newCount >= AI_PROMPT_LIMIT && !isPrivileged) setLimitReached(true);

      // Call Gemini (with optional images)
      const reply = await sendChatMessage(
        userText,
        messages,
        resolvedApiKey,
        imagesSnapshot
      );
      const assistantMsg = await saveMessage(userId, "assistant", reply);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = await saveMessage(
        userId,
        "assistant",
        "I couldn't respond right now 🌙 Please try again shortly."
      );
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!userId) return;
    await clearChatHistory(userId);
    setMessages([]);
    setPromptCount(0);
    setLimitReached(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Image helpers ─────────────────────────────────────────

  const processImageFile = (file: File) => {
    // 1. Determine mime type and validate image
    let mimeType = file.type;
    if (!mimeType || !mimeType.startsWith("image/")) {
      const ext = file.name?.split(".").pop()?.toLowerCase();
      if (ext === "png") mimeType = "image/png";
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "webp") mimeType = "image/webp";
      else if (ext === "gif") mimeType = "image/gif";
      else if (ext === "bmp") mimeType = "image/bmp";
      else if (ext === "svg") mimeType = "image/svg+xml";
      else {
        toast.error("Only image files can be attached");
        return;
      }
    }

    if (!isPrivileged && pastedImagesRef.current.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const base64 = dataUrl.split(",")[1];

      if (!isPrivileged && pastedImagesRef.current.length >= 5) {
        toast.error("Maximum 5 images allowed");
        return;
      }

      setPastedImages((current) => {
        if (!isPrivileged && current.length >= 5) {
          return current;
        }
        return [...current, { base64, mimeType: file.type, preview: dataUrl }];
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check files directly (e.g. copied from desktop/file explorer)
    const files = Array.from(clipboardData.files || []);
    const imageFiles = files.filter(
      (f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(f.name)
    );

    if (imageFiles.length > 0) {
      const filesToProcess = isPrivileged ? imageFiles : imageFiles.slice(0, 5);
      filesToProcess.forEach((file) => processImageFile(file));
      e.preventDefault();
      return;
    }

    // 2. Check items (screenshots, copied images from browser)
    const items = Array.from(clipboardData.items || []);
    let hasImage = false;
    for (const item of items) {
      if (item.type.startsWith("image/") || item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          hasImage = true;
        }
      }
    }

    if (hasImage) {
      e.preventDefault();
      return;
    }

    // 3. Fallback: check HTML for embedded base64 image
    const html = clipboardData.getData("text/html");
    if (html) {
      const match = html.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["']/i);
      if (match) {
        const dataUrl = match[1];
        const mimeType = dataUrl.split(";")[0].replace("data:", "");
        const base64 = dataUrl.split(",")[1];

        if (!isPrivileged && pastedImagesRef.current.length >= 5) {
          toast.error("Maximum 5 images allowed");
          e.preventDefault();
          return;
        }

        setPastedImages((current) => {
          if (!isPrivileged && current.length >= 5) {
            return current;
          }
          return [...current, { base64, mimeType, preview: dataUrl }];
        });
        e.preventDefault();
      }
    }
  };

  // Global window paste listener so Ctrl+V works even if textarea is not focused
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if paste originated inside textarea or another input (it already has onPaste)
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      handlePaste(e as unknown as React.ClipboardEvent);
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(
      (f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(f.name)
    );
    if (files.length > 0 && imageFiles.length === 0) {
      toast.error("Only images can be dropped here");
      return;
    }
    const filesToProcess = isPrivileged ? imageFiles : imageFiles.slice(0, 5);
    filesToProcess.forEach((file) => processImageFile(file));
  };

  if (initLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const remaining = Math.max(0, AI_PROMPT_LIMIT - promptCount);

  return (
    <div className="relative flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-8rem)] max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center overflow-hidden shadow">
            <Image src="/logo.png" alt="Nila AI" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-on-surface leading-tight">Nila AI 🌙</h1>
            <p className="text-xs text-secondary">Your mindful companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Prompt counter pill */}
          {isPrivileged ? (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/20 shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">all_inclusive</span>
              {isAdmin ? "Admin" : "Special"}
            </span>
          ) : (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              limitReached
                ? "bg-error-container text-on-error-container border-error-container"
                : remaining <= 3
                ? "bg-tertiary-container text-on-tertiary-container border-tertiary-container"
                : "bg-secondary-container text-on-secondary-container border-secondary-container"
            }`}>
              {limitReached ? "Limit reached" : `${remaining} left`}
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              title="Clear chat"
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Limit Reached Banner Overlay ── */}
      {limitReached && !hideBanner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-3xl p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl bg-surface bg-gradient-to-br from-background to-secondary-container/20 w-full max-w-lg">
            <button
              onClick={() => setHideBanner(true)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-black/5 transition-colors z-10"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-6">
              {/* Nila mascot pick */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary/10 ring-4 ring-primary/20 overflow-hidden shadow-md flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Nila"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2 text-center sm:text-left pr-4">
                <p className="font-bold text-base text-on-surface">
                  You&apos;ve used all {AI_PROMPT_LIMIT} chats for today 🌙
                </p>
                <p className="text-sm text-secondary leading-relaxed">
                  Your daily limit resets at midnight. Want unlimited access?
                  Contact admin to upgrade your account.
                </p>
                <div className="mt-2">
                  <a
                    href={`mailto:${ADMIN_EMAIL}?subject=Nila AI Upgrade Request&body=Hi,%20I'd%20like%20to%20upgrade%20my%20Nila%20AI%20access.%20My%20account%20email%20is%20${encodeURIComponent(currentUser?.email ?? "")}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow hover:opacity-90 transition-all active:scale-[0.97]"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Contact Admin to Upgrade
                  </a>
                  <p className="text-[11px] text-secondary/70 mt-2 ml-1">
                    {ADMIN_EMAIL}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Messages ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 pb-2">
        {messages.length === 0 && !limitReached && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 ring-2 ring-primary/20 overflow-hidden shadow">
              <Image src="/logo.png" alt="Nila" width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-on-surface text-base">Hello, {currentUser?.name?.split(" ")[0] ?? "love"} 💖</p>
              <p className="text-sm text-secondary mt-1 max-w-xs">
                I&apos;m Nila, your mindful companion. Ask me anything — about your day,
                your intentions, or just to reflect together.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "What intentions should I set today? 🌸",
                "Help me plan my evening wind-down 🌙",
                "I'm feeling overwhelmed, any advice? ✨",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container border border-secondary-container/60 hover:opacity-80 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/20 overflow-hidden flex-shrink-0 mt-0.5">
                <Image src="/logo.png" alt="Nila" width={32} height={32} className="w-full h-full object-cover" />
              </div>
            )}

            <div
              className={`max-w-[85%] md:max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                msg.role === "user"
                  ? "bg-primary text-on-primary rounded-tr-sm"
                  : "bg-surface-container-low text-on-surface border border-outline-variant/30 rounded-tl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none break-words text-on-surface prose-p:my-1.5 prose-headings:font-bold prose-headings:text-on-surface prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:font-bold prose-strong:text-on-surface prose-pre:bg-surface-container prose-pre:p-3 prose-pre:rounded-xl">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              )}
              <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-on-primary/60 text-right" : "text-secondary/60"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/20 overflow-hidden flex-shrink-0 mt-0.5">
              <Image src="/logo.png" alt="Nila" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      {!limitReached && (
        <div
          className="pt-3 border-t border-outline-variant/20"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {!resolvedApiKey && (
            <p className="text-xs text-secondary mb-2 text-center">
              ⚠️ No AI API key configured. Add <code>NEXT_PUBLIC_AI_API_KEY</code> in Settings.
            </p>
          )}

          {/* Image preview — square boxes */}
          {pastedImages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 items-center">
              {pastedImages.map((img, idx) => (
                <div key={idx} className="relative inline-flex">
                  <button
                    onClick={() => setLightboxImage(img.preview)}
                    className="w-20 h-20 rounded border border-outline-variant/60 overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/40 transition-all flex-shrink-0"
                    title="Click to view full image"
                  >
                    <img
                      src={img.preview}
                      alt={`Attached image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    onClick={() => setPastedImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-error text-on-error flex items-center justify-center shadow-sm hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ))}
              {(isPrivileged || pastedImages.length < 5) && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded border-2 border-dashed border-outline-variant hover:border-primary/50 flex flex-col items-center justify-center text-secondary hover:text-primary transition-all gap-1 text-[11px] font-medium"
                  title="Attach another image"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>{isPrivileged ? `+ Add (${pastedImages.length})` : `${pastedImages.length}/5`}</span>
                </button>
              )}
            </div>
          )}

          {/* Lightbox */}
          {lightboxImage && (
            <div
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setLightboxImage(null)}
            >
              <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img
                  src={lightboxImage}
                  alt="Full image"
                  className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                />
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              Array.from(e.target.files || []).forEach((f) => processImageFile(f));
              e.target.value = "";
            }}
          />

          <div className="flex items-end gap-2">
            {/* Image attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !resolvedApiKey}
              className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container border border-outline-variant/40 transition-colors disabled:opacity-40 flex-shrink-0"
              title="Attach or paste an image"
            >
              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={pastedImages.length > 0 ? "Add a caption or just send..." : "Ask Nila anything… or paste an image"}
              rows={1}
              disabled={loading || !resolvedApiKey}
              className="flex-1 resize-none rounded-2xl px-4 py-3 bg-surface-container-low border border-outline-variant text-on-surface text-sm placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 leading-relaxed max-h-32 overflow-y-auto"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && pastedImages.length === 0) || !resolvedApiKey}
              className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow hover:opacity-90 transition-all active:scale-[0.95] disabled:opacity-40 flex-shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">send</span>
              )}
            </button>
          </div>
          <p className="text-[10px] text-secondary/50 text-center mt-1.5">
            {isPrivileged
              ? "Unlimited prompts & images • Paste or drag images"
              : remaining > 0
              ? `${remaining} of ${AI_PROMPT_LIMIT} messages remaining today • Up to 5 images`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}
