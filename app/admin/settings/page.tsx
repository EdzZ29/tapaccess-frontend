"use client";

import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { useAdmin } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/panel";
import { api, errorMessage } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const MIN_PASSWORD = 10;

export default function SettingsPage() {
  const admin = useAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Your administrator account." />
      <div className="space-y-6">
        {admin && <AccountPanel key={admin.name} admin={admin} />}
        <PasswordPanel />
      </div>
    </div>
  );
}

function AccountPanel({ admin }: { admin: AdminUser }) {
  const [name, setName] = useState(admin.name);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api<{ admin: AdminUser }>("/auth/me", { method: "PATCH", body: { name } });
      await mutate("/auth/me", res, { revalidate: false });
      toast.success("Account updated");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <PanelHeader title="Account" description={`Last sign-in ${formatDate(admin.lastLoginAt, { dateStyle: "medium", timeStyle: "short" })}`} />
      <form onSubmit={save} className="space-y-4 p-5">
        <Field label="Email" hint="Change the email with the admin:create CLI on the server.">
          {(p) => <Input {...p} value={admin.email} disabled readOnly />}
        </Field>
        <Field label="Display name">
          {(p) => <Input {...p} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} required />}
        </Field>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving} disabled={!name.trim() || name === admin.name}>
            Save
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function PasswordPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [saving, setSaving] = useState(false);
  const mismatch = repeat.length > 0 && next !== repeat;
  const tooShort = next.length > 0 && next.length < MIN_PASSWORD;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      toast.success("Password changed. Other sessions were signed out.");
      setCurrent("");
      setNext("");
      setRepeat("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <PanelHeader title="Change password" description="Changing your password signs out every other device." />
      <form onSubmit={save} className="space-y-4 p-5">
        <Field label="Current password">
          {(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />}
        </Field>
        <Field label="New password" hint={`At least ${MIN_PASSWORD} characters. A passphrase is best.`} error={tooShort ? `Use at least ${MIN_PASSWORD} characters` : null}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />}
        </Field>
        <Field label="Repeat new password" error={mismatch ? "Passwords don't match" : null}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />}
        </Field>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving} disabled={!current || next.length < MIN_PASSWORD || next !== repeat}>
            Change password
          </Button>
        </div>
      </form>
    </Panel>
  );
}
