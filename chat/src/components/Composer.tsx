"use client";

import type { RefObject } from "react";
import { IconImage, IconSend, IconX } from "./Icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  imagePreview: string | null;
  onPickImage: (file: File) => void;
  onClearImage: () => void;
  notice: string | null;
  busy: boolean;
  big?: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

// The message box at the bottom: photo button, text, send.
export default function Composer({
  value, onChange, onSend, imagePreview, onPickImage, onClearImage, notice, busy, big, fileInputRef,
}: Props) {
  const canSend = !busy && (value.trim().length > 0 || imagePreview !== null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
    >
      <label htmlFor="ask" className="sr-only">{big ? "Ask for anything" : "Ask a follow-up"}</label>

      {imagePreview && (
        <div className="mb-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="The photo you picked" className="h-14 w-14 rounded-xl object-cover" />
          <button
            type="button"
            onClick={onClearImage}
            aria-label="Remove photo"
            className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-snow"
          >
            <IconX />
          </button>
        </div>
      )}

      <div className={`flex items-center gap-1 rounded-[26px] border border-line bg-panel p-1.5 ${big ? "py-2" : ""}`}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add a photo"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mute hover:text-snow"
        >
          <IconImage />
        </button>
        <input
          id="ask"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={300}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={big ? "Ask for anything…" : "Ask a follow-up…"}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-snow placeholder:text-mute focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-night transition disabled:opacity-40"
        >
          <IconSend />
        </button>
      </div>

      {notice && <p role="alert" className="mt-2 text-xs text-accent">{notice}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickImage(file);
          e.target.value = "";
        }}
      />
    </form>
  );
}