"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { Input } from "./field";

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "default";
  /** Require typing this exact text before the confirm button enables. */
  requireText?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** `const ok = await confirm({...})`, a promise-based confirmation dialog. */
export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return fn;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback<ConfirmFn>((options) => {
    setTyped("");
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = undefined;
    setOpts(null);
  };

  const blocked = Boolean(opts?.requireText && typed.trim() !== opts.requireText);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={opts !== null}
        onClose={() => settle(false)}
        size="sm"
        title={opts?.title}
        description={opts?.description}
        footer={
          <>
            <Button onClick={() => settle(false)}>Cancel</Button>
            <Button
              variant={opts?.tone === "danger" ? "danger" : "primary"}
              disabled={blocked}
              onClick={() => settle(true)}
              autoFocus={!opts?.requireText}
            >
              {opts?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        {opts?.requireText && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!blocked) settle(true);
            }}
            className="space-y-2 pb-1"
          >
            <label className="block text-sm text-ink-2">
              Type <span className="font-mono font-semibold text-ink">{opts.requireText}</span> to confirm
            </label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" spellCheck={false} />
          </form>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}
