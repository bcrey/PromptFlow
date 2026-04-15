"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Prompt } from "@/types/prompt";

interface PromptItemProps {
  prompt: Prompt;
  onToggleDone: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  sortable?: boolean;
}

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export default function PromptItem({ prompt, onToggleDone, onEdit, sortable = true }: PromptItemProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(prompt.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: prompt.id,
    disabled: !sortable || prompt.done || editing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  useEffect(() => {
    if (editing) {
      autoResize(textareaRef.current);
      textareaRef.current?.focus();
      // Place cursor at end
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    }
  }, [editing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const startEditing = () => {
    if (prompt.done) return;
    setEditText(prompt.text);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== prompt.text) {
      onEdit(prompt.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2.5 rounded-xl px-3 py-3 text-[14px] transition-all duration-75 ${
        isDragging
          ? "bg-[var(--color-surface)] shadow-lg shadow-black/8 ring-1 ring-[var(--color-border)]"
          : prompt.done
            ? "opacity-50"
            : "hover:bg-[var(--color-surface-hover)]"
      }`}
    >
      {/* Drag handle */}
      {!prompt.done ? (
        <button
          className="cursor-grab active:cursor-grabbing text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-50 hover:!opacity-100 shrink-0 touch-none transition-opacity duration-75 mt-0.5"
          {...attributes}
          {...listeners}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5.5" cy="4.5" r="1.2" />
            <circle cx="5.5" cy="8" r="1.2" />
            <circle cx="5.5" cy="11.5" r="1.2" />
            <circle cx="10.5" cy="4.5" r="1.2" />
            <circle cx="10.5" cy="8" r="1.2" />
            <circle cx="10.5" cy="11.5" r="1.2" />
          </svg>
        </button>
      ) : (
        <div className="w-3.5 shrink-0" />
      )}

      {/* Checkbox */}
      <button
        onClick={() => onToggleDone(prompt.id)}
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-100 mt-px ${
          prompt.done
            ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
            : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
        }`}
      >
        {prompt.done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pop">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Copy to clipboard */}
      <div className="relative shrink-0 mt-px">
        <button
          onClick={handleCopy}
          className={`p-1 rounded-md transition-all duration-75 ${
            copied
              ? "text-[var(--color-accent)] opacity-100"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-active)] opacity-0 group-hover:opacity-100"
          }`}
          title="Copy to clipboard"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        </button>
        {copied && (
          <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 px-2 py-1 text-[11px] font-medium text-white bg-[var(--color-text-primary)] rounded-md whitespace-nowrap shadow-lg animate-slide-down pointer-events-none z-10">
            Copied!
          </span>
        )}
      </div>

      {/* Text / Edit */}
      {editing ? (
        <textarea
          ref={textareaRef}
          className="flex-1 min-w-0 bg-[var(--color-bg)] border border-[var(--color-accent)] rounded-lg px-3 py-1.5 text-[14px] text-[var(--color-text-primary)] outline-none resize-none leading-relaxed"
          value={editText}
          onChange={(e) => {
            setEditText(e.target.value);
            autoResize(e.target);
          }}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setEditing(false); }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { commitEdit(); }
          }}
        />
      ) : (
        <span
          onClick={startEditing}
          className={`flex-1 min-w-0 whitespace-pre-wrap leading-relaxed transition-all duration-100 ${
            prompt.done
              ? "line-through text-[var(--color-text-tertiary)] cursor-default"
              : "text-[var(--color-text-primary)] cursor-text hover:text-[var(--color-text-primary)]"
          }`}
        >
          {prompt.text}
        </span>
      )}
    </div>
  );
}
