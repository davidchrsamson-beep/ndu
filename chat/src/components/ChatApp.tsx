"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { logHandoff, searchVendors, type VendorResult } from "@/app/actions";
import { formatNaira } from "@/lib/format";
import Composer from "./Composer";
import ResultCard from "./ResultCard";
import { IconGift, IconImage, IconPerson, IconPlus, IconShirt, IconSparkle } from "./Icons";

const TEAM_WHATSAPP = (process.env.NEXT_PUBLIC_TEAM_WHATSAPP ?? "").replace(/\D/g, "");
const MARKET_URL = process.env.NEXT_PUBLIC_MARKET_URL ?? "";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

type SortKey = "best" | "low" | "high" | "new";
type UserMsg = { id: string; role: "user"; text: string; imageUrl?: string };
type ResultsMsg = {
  id: string;
  role: "errand";
  kind: "results";
  request: string;
  results: VendorResult[];
  budgetKobo: number | null;
  shown: number;
  sort: SortKey;
};
type NoteMsg = { id: string; role: "errand"; kind: "note"; text: string; request: string };
type Msg = UserMsg | ResultsMsg | NoteMsg;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "best", label: "Best match" },
  { key: "low", label: "Lowest price" },
  { key: "high", label: "Highest price" },
  { key: "new", label: "Newest" },
];

const SUGGESTIONS = [
  { Icon: IconGift, text: "Christmas gift for my sister under ₦15k", photo: false },
  { Icon: IconShirt, text: "New year fit for a December party", photo: false },
  { Icon: IconSparkle, text: "Toys and clothes for my kids", photo: false },
  { Icon: IconImage, text: "Find this from a photo", photo: true },
];

function sortResults(list: VendorResult[], sort: SortKey) {
  const copy = [...list];
  if (sort === "low") copy.sort((a, b) => a.priceKobo - b.priceKobo);
  else if (sort === "high") copy.sort((a, b) => b.priceKobo - a.priceKobo);
  else if (sort === "new") copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  else copy.sort((a, b) => b.score - a.score || a.priceKobo - b.priceKobo);
  return copy;
}

export default function ChatApp() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const counter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const nextId = () => String(++counter.current);
  const add = (msg: Msg) => setMessages((m) => [...m, msg]);
  const lastErrandId = [...messages].reverse().find((m) => m.role === "errand")?.id;

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  function runSearch(request: string, budgetOverrideKobo: number | null = null) {
    startTransition(async () => {
      const res = await searchVendors(request, budgetOverrideKobo);
      if (!res.ok) {
        add({ id: nextId(), role: "errand", kind: "note", text: res.error, request });
      } else if (res.results.length === 0) {
        add({
          id: nextId(),
          role: "errand",
          kind: "note",
          request,
          text: budgetOverrideKobo
            ? "Nothing cheaper in Ndu stores right now. Want a real person to hunt for a better deal?"
            : "I couldn't find that in Ndu stores yet. Our team can hunt it down for you.",
        });
      } else {
        add({
          id: nextId(),
          role: "errand",
          kind: "results",
          request,
          results: res.results,
          budgetKobo: res.budgetKobo,
          shown: 3,
          sort: "best",
        });
      }
    });
  }

  function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (isPending || (!text && !image)) return;

    add({ id: nextId(), role: "user", text, imageUrl: image ?? undefined });
    setInput("");
    setImage(null);
    setNotice(null);

    if (!text) {
      // Photo only: honest about what works today.
      add({
        id: nextId(),
        role: "errand",
        kind: "note",
        request: "I have a photo of what I want",
        text: "Nice pick. Photo search is coming soon, so tell me what it is in a few words (like “red lace gown, size 12”). Or hand it to a real person and send them the photo on WhatsApp.",
      });
      return;
    }
    runSearch(text);
  }

  function pickImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setNotice("That file isn't a photo. Try a JPG or PNG.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setNotice("That photo is over 10 MB. Try a smaller one.");
      return;
    }
    if (image) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(file));
    setNotice(null);
  }

  function clearImage() {
    if (image) URL.revokeObjectURL(image);
    setImage(null);
  }

  function newChat() {
    messages.forEach((m) => m.role === "user" && m.imageUrl && URL.revokeObjectURL(m.imageUrl));
    setMessages([]);
    setInput("");
    clearImage();
    setNotice(null);
  }

  function setSort(id: string, sort: SortKey) {
    setMessages((ms) => ms.map((m) => (m.role === "errand" && m.kind === "results" && m.id === id ? { ...m, sort } : m)));
  }

  function moreLikeThis(id: string) {
    setMessages((ms) =>
      ms.map((m) => (m.role === "errand" && m.kind === "results" && m.id === id ? { ...m, shown: m.shown + 3 } : m)),
    );
  }

  function cheaper(m: ResultsMsg) {
    const lowest = Math.min(...m.results.map((r) => r.priceKobo));
    add({ id: nextId(), role: "user", text: "Cheaper options" });
    runSearch(m.request, Math.floor(lowest * 0.9));
  }

  function handOff(request: string) {
    if (!TEAM_WHATSAPP) {
      setNotice("The team's WhatsApp number isn't set up yet.");
      return;
    }
    void logHandoff(request);
    const text = `Hi Ndu team! I'm looking for: ${request}`;
    window.open(`https://wa.me/${TEAM_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  const composer = (big: boolean) => (
    <Composer
      big={big}
      value={input}
      onChange={setInput}
      onSend={() => send()}
      imagePreview={image}
      onPickImage={pickImage}
      onClearImage={clearImage}
      notice={notice}
      busy={isPending}
      fileInputRef={fileInputRef}
    />
  );

  // ---------- Home: before the first message ----------
  if (messages.length === 0) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-6 pt-3">
        <header className="flex h-11 items-center justify-between">
          <span className="text-lg font-bold tracking-tight">errand</span>
          <a href={`${MARKET_URL}/vendor/signup`} className="text-sm text-mute hover:text-snow">Sell on Ndu</a>
        </header>

        <main className="flex flex-1 flex-col justify-end gap-7 pb-5">
          <div className="px-1">
            <h1 className="text-[42px] font-bold leading-[1.02] tracking-tight">
              What are we <span className="text-accent">buying</span> today?
            </h1>
            <p className="mt-3 text-base leading-relaxed text-mute">
              Tell me what you need. I&apos;ll find trusted vendors in Calabar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {SUGGESTIONS.map(({ Icon, text, photo }) => (
              <button
                key={text}
                type="button"
                onClick={() => (photo ? fileInputRef.current?.click() : send(text))}
                className="flex min-h-26 flex-col gap-2.5 rounded-[20px] border border-line bg-panel p-3.5 text-left transition hover:border-line-strong"
              >
                <span className="text-accent"><Icon /></span>
                <span className="text-sm leading-snug">{text}</span>
              </button>
            ))}
          </div>
        </main>

        {composer(true)}
        <p className="mt-3 text-center text-xs text-mute">Vendors verified by Ndu · You pay them directly</p>
      </div>
    );
  }

  // ---------- Chat: after the first message ----------
  const actions = (m: ResultsMsg | NoteMsg) => (
    <div className="flex flex-wrap gap-2 px-4">
      {m.kind === "results" && m.shown < m.results.length && (
        <Chip onClick={() => moreLikeThis(m.id)}>More like this</Chip>
      )}
      {m.kind === "results" && <Chip onClick={() => cheaper(m)}>Cheaper</Chip>}
      <button
        type="button"
        onClick={() => handOff(m.request)}
        className="flex h-11 items-center gap-1.5 rounded-full border border-accent px-3.5 text-sm font-semibold text-accent"
      >
        <IconPerson /> Hand to a real person
      </button>
    </div>
  );

  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col">
      <header className="flex items-center justify-between px-3 py-2">
        <button type="button" onClick={newChat} className="h-11 px-2 text-base font-bold tracking-tight">errand</button>
        <button
          type="button"
          onClick={newChat}
          aria-label="New chat"
          className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-snow"
        >
          <IconPlus />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto py-2" aria-live="polite">
        <div className="flex flex-col gap-5">
          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="ml-auto mr-4 flex max-w-[78%] flex-col items-end gap-1.5">
                  {m.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageUrl} alt="Your photo" className="h-24 w-20 rounded-2xl object-cover" />
                  )}
                  {m.text && (
                    <p className="rounded-[20px] rounded-br-md bg-accent px-4 py-3 text-[15px] font-medium leading-snug text-night">
                      {m.text}
                    </p>
                  )}
                </div>
              );
            }

            if (m.kind === "note") {
              return (
                <section key={m.id} className="flex flex-col gap-3">
                  <p className="px-4 text-[15px] leading-relaxed">{m.text}</p>
                  {m.id === lastErrandId && actions(m)}
                </section>
              );
            }

            const n = m.results.length;
            return (
              <section key={m.id} className="flex flex-col gap-3" aria-label="Vendors found">
                <div className="px-4">
                  <p className="text-[15px] leading-relaxed">
                    Say less. {n} Calabar {n === 1 ? "vendor has" : "vendors have"} it.{n > 1 ? " Swipe to compare." : ""}
                  </p>
                  {m.budgetKobo && <p className="mt-0.5 text-xs text-mute">Up to {formatNaira(m.budgetKobo)}</p>}
                </div>

                {n > 1 && (
                  <div role="group" aria-label="Sort results" className="flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                    <span className="shrink-0 text-[13px] text-mute">Sort</span>
                    {SORTS.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        aria-pressed={m.sort === s.key}
                        onClick={() => setSort(m.id, s.key)}
                        className={`h-10 shrink-0 rounded-full border px-3.5 text-[13px] transition ${
                          m.sort === s.key ? "border-accent bg-accent font-bold text-night" : "border-line-strong"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                  {sortResults(m.results, m.sort)
                    .slice(0, m.shown)
                    .map((r) => (
                      <ResultCard key={r.vendorSlug} r={r} marketUrl={MARKET_URL} />
                    ))}
                </div>

                {m.id === lastErrandId && actions(m)}
              </section>
            );
          })}

          {isPending && <p className="animate-pulse px-4 text-sm text-mute">Checking Calabar vendors…</p>}
          <div ref={endRef} />
        </div>
      </main>

      <div className="px-4 pb-5 pt-2">{composer(false)}</div>
    </div>
  );
}

function Chip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 rounded-full border border-line-strong px-3.5 text-sm transition hover:border-mute"
    >
      {children}
    </button>
  );
}