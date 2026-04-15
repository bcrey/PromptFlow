"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Project } from "@/types/prompt";
import PromptItem from "./PromptItem";

interface PromptListProps {
  project: Project;
  onAdd: (text: string) => void;
  onEdit: (promptId: string, text: string) => void;
  onToggleDone: (promptId: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onClearDone: () => void;
}

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export default function PromptList({
  project,
  onAdd,
  onEdit,
  onToggleDone,
  onReorder,
  onClearDone,
}: PromptListProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activePrompts = project.prompts.filter((p) => !p.done);
  const donePrompts = project.prompts.filter((p) => p.done);

  useEffect(() => {
    autoResize(textareaRef.current);
  }, [input]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text) return;
    onAdd(text);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* Input */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-2 items-start">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_1px_var(--color-accent)] transition-all placeholder:text-[var(--color-text-tertiary)] resize-none leading-relaxed overflow-hidden"
              placeholder="Write a prompt..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            {input.trim() && (
              <span className="absolute right-3 bottom-3 text-[10px] text-[var(--color-text-tertiary)] px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border-subtle)] font-mono pointer-events-none">
                {navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}&crarr;
              </span>
            )}
          </div>
          <button
            className={`px-5 py-3 text-[14px] font-medium rounded-xl transition-all shrink-0 ${
              input.trim()
                ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-sm"
                : "bg-[var(--color-surface-active)] text-[var(--color-text-tertiary)] cursor-default"
            }`}
            onClick={handleSubmit}
          >
            Add
          </button>
        </div>
        <p className="text-[12px] text-[var(--color-text-tertiary)] mt-2 px-1">
          {project.prompts.length === 0
            ? "No prompts yet"
            : `${activePrompts.length} active${donePrompts.length > 0 ? ` \u00b7 ${donePrompts.length} done` : ""}`}
        </p>
      </div>

      {/* Prompt list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {project.prompts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 select-none">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-tertiary)] text-[13px]">
              Add your first prompt above
            </p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activePrompts.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {activePrompts.map((prompt) => (
                <PromptItem
                  key={prompt.id}
                  prompt={prompt}
                  onToggleDone={onToggleDone}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {donePrompts.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-[12px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
                Done
              </span>
              <button
                className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-colors px-2 py-0.5 rounded-md hover:bg-[var(--color-danger-light)]"
                onClick={onClearDone}
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {donePrompts.map((prompt) => (
                <PromptItem
                  key={prompt.id}
                  prompt={prompt}
                  onToggleDone={onToggleDone}
                  onEdit={onEdit}
                  sortable={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
