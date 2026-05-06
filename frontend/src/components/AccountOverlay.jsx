// ============================================================
// ARC-NEXUS - ACCOUNT OVERLAY
// File: src/components/AccountOverlay.jsx
// Version: 002 (editable profile fields, phone formatting)
// ============================================================

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import PageOverlay from "./PageOverlay";
import { getTierConfig } from "../lib/tiers";

// ── Styles ───────────────────────────────────────────────────

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.13)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: "0.9rem",
  color: "var(--arc-text)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const btnPrimary = {
  all: "unset",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 20px",
  borderRadius: 8,
  fontSize: "0.88rem",
  fontWeight: 600,
  background: "rgba(56,189,248,0.18)",
  border: "1px solid rgba(56,189,248,0.45)",
  color: "#7dd3fc",
  transition: "opacity 0.15s",
  boxSizing: "border-box",
};

const btnSecondary = {
  all: "unset",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 20px",
  borderRadius: 8,
  fontSize: "0.88rem",
  fontWeight: 600,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.55)",
  transition: "opacity 0.15s",
  boxSizing: "border-box",
};

const btnInlineEdit = {
  all: "unset",
  cursor: "pointer",
  fontSize: "0.75rem",
  color: "rgba(100,180,240,0.75)",
  borderBottom: "1px dotted rgba(100,180,240,0.35)",
  paddingBottom: 1,
  lineHeight: 1,
  marginLeft: "auto",
  flexShrink: 0,
};

const editBoxStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10,
  padding: "14px 14px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 2,
};

// ── Phone formatter ──────────────────────────────────────────

function formatPhone(raw) {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return trimmed;
}

// ── Sub-components ───────────────────────────────────────────

function InfoRow({ label, value, emptyText = "—", noEdit, onEdit, isEditing, valueColor, bold }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <span
        style={{
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.45)",
          minWidth: 82,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.88rem",
          color: valueColor || (value ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.28)"),
          fontWeight: bold ? 600 : undefined,
          wordBreak: "break-all",
          flex: 1,
        }}
      >
        {value || emptyText}
      </span>
      {!noEdit && !isEditing && (
        <button style={btnInlineEdit} onClick={onEdit}>
          {value ? "Edit" : "Add"}
        </button>
      )}
    </div>
  );
}

function LabeledInput({ label, type = "text", value, onChange, placeholder, autoFocus }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={inputStyle}
      />
    </div>
  );
}

function EditActions({ onSave, onCancel, saving }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <button
        style={{ ...btnPrimary, padding: "7px 16px", fontSize: "0.82rem", opacity: saving ? 0.6 : 1 }}
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        style={{ ...btnSecondary, padding: "7px 16px", fontSize: "0.82rem" }}
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </button>
    </div>
  );
}

// ── Change Password section ──────────────────────────────────

function ChangePasswordSection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState(null); // { type: "error"|"success", text }
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPw.trim() || !newPw.trim() || !confirmPw.trim()) {
      setMsg({ type: "error", text: "Complete all password fields." });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setMsg(null);
    setLoading(true);

    // Re-authenticate with current password before updating
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    if (email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPw.trim(),
      });

      if (signInError) {
        setLoading(false);
        setMsg({ type: "error", text: "Current password is incorrect." });
        return;
      }
    } else {
      setLoading(false);
      setMsg({
        type: "error",
        text: "For security, password changes may require signing in again or using password reset.",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);

    if (error) {
      setMsg({ type: "error", text: error.message || "Could not update password. Please try again." });
      return;
    }

    setMsg({ type: "success", text: "Password updated." });
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 700 }}>
        Change Password
      </h3>

      <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
        For security, your current password is verified before making changes.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LabeledInput
          label="Current password"
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Your current password"
        />
        <LabeledInput
          label="New password"
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="New password"
        />
        <LabeledInput
          label="Confirm new password"
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Repeat new password"
        />
      </div>

      {msg && (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "0.82rem",
            color: msg.type === "success" ? "#4ade80" : "#f87171",
          }}
        >
          {msg.text}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}

// ── Main overlay ─────────────────────────────────────────────

export default function AccountOverlay({ onClose, user, profile, onProfileUpdate }) {
  const [localProfile, setLocalProfile] = useState(profile || {});

  // editing: null | "name" | "phone" | "company"
  const [editing, setEditing] = useState(null);
  const [nameFirst, setNameFirst] = useState("");
  const [nameLast, setNameLast] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type: "error"|"success", text }

  const tier = localProfile?.tier || "free";
  const tierLabel = getTierConfig(tier).label;
  const firstName = localProfile?.first_name || null;
  const lastName = localProfile?.last_name || null;
  const phone = localProfile?.phone || null;
  const company = localProfile?.company || null;
  const verified = !!user?.email_confirmed_at;

  // ── Edit controls ────────────────────────────────────────

  const startEdit = (field) => {
    setSaveMsg(null);
    if (field === "name") {
      setNameFirst(firstName || "");
      setNameLast(lastName || "");
    } else if (field === "phone") {
      setFieldValue(phone || "");
    } else if (field === "company") {
      setFieldValue(company || "");
    }
    setEditing(field);
  };

  const cancelEdit = () => {
    setEditing(null);
    setFieldValue("");
    setNameFirst("");
    setNameLast("");
  };

  const saveField = async (updates) => {
    setSaving(true);
    setSaveMsg(null);
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setSaveMsg({ type: "error", text: error.message || "Could not save. Try again." });
      return false;
    }
    const updated = { ...localProfile, ...data };
    setLocalProfile(updated);
    if (onProfileUpdate) onProfileUpdate(updated);
    setSaveMsg({ type: "success", text: "Saved." });
    setEditing(null);
    return true;
  };

  const handleSaveName = async () => {
    if (!nameFirst.trim() || !nameLast.trim()) {
      setSaveMsg({ type: "error", text: "First name and last name cannot be blank." });
      return;
    }
    await saveField({ first_name: nameFirst.trim(), last_name: nameLast.trim() });
  };

  const handleSavePhone = async () => {
    const raw = fieldValue.trim();
    if (raw) {
      const digits = raw.replace(/\D/g, "");
      if (!raw.startsWith("+") && digits.length < 7) {
        setSaveMsg({ type: "error", text: "Enter a valid phone number, or leave blank to remove." });
        return;
      }
    }
    await saveField({ phone: raw ? formatPhone(raw) : null });
  };

  const handleSaveCompany = async () => {
    await saveField({ company: fieldValue.trim() || null });
  };

  return (
    <PageOverlay title="Account" onClose={onClose}>

      {/* ── Account Info ── */}
      <div className="panel">
        <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700 }}>
          Account Info
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* First Name */}
          <InfoRow
            label="First Name"
            value={firstName}
            emptyText="Not entered"
            onEdit={() => startEdit("name")}
            isEditing={editing === "name"}
          />

          {/* Last Name */}
          <InfoRow
            label="Last Name"
            value={lastName}
            emptyText="Not entered"
            onEdit={() => startEdit("name")}
            isEditing={editing === "name"}
          />

          {/* Name edit form */}
          {editing === "name" && (
            <div style={editBoxStyle}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <LabeledInput
                  label="First Name *"
                  value={nameFirst}
                  onChange={(e) => setNameFirst(e.target.value)}
                  placeholder="First"
                  autoFocus
                />
                <LabeledInput
                  label="Last Name *"
                  value={nameLast}
                  onChange={(e) => setNameLast(e.target.value)}
                  placeholder="Last"
                />
              </div>
              <EditActions onSave={handleSaveName} onCancel={cancelEdit} saving={saving} />
            </div>
          )}

          {/* Email — read-only */}
          <InfoRow label="Email" value={user?.email} noEdit />

          {/* Phone */}
          <InfoRow
            label="Phone"
            value={phone ? formatPhone(phone) : null}
            emptyText="Not entered"
            onEdit={() => startEdit("phone")}
            isEditing={editing === "phone"}
          />
          {editing === "phone" && (
            <div style={editBoxStyle}>
              <LabeledInput
                label="Phone"
                type="tel"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="+1 555 000 0000"
                autoFocus
              />
              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                Leave blank to remove.
              </p>
              <EditActions onSave={handleSavePhone} onCancel={cancelEdit} saving={saving} />
            </div>
          )}

          {/* Company */}
          <InfoRow
            label="Company"
            value={company}
            emptyText="Not entered"
            onEdit={() => startEdit("company")}
            isEditing={editing === "company"}
          />
          {editing === "company" && (
            <div style={editBoxStyle}>
              <LabeledInput
                label="Company"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="Your company or organization"
                autoFocus
              />
              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                Leave blank to remove.
              </p>
              <EditActions onSave={handleSaveCompany} onCancel={cancelEdit} saving={saving} />
            </div>
          )}

          {/* Verified — always shown */}
          <InfoRow
            label="Verified"
            value={verified ? "Yes" : "No"}
            valueColor={verified ? "#4ade80" : "rgba(255,255,255,0.4)"}
            noEdit
          />

          {/* Plan */}
          <InfoRow
            label="Plan"
            value={tierLabel}
            valueColor={tier === "free" ? "rgba(255,255,255,0.6)" : "#7dd3fc"}
            bold
            noEdit
          />

        </div>

        {saveMsg && (
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "0.82rem",
              color: saveMsg.type === "success" ? "#4ade80" : "#f87171",
            }}
          >
            {saveMsg.text}
          </p>
        )}
      </div>

      {/* ── Change Password ── */}
      <ChangePasswordSection />

    </PageOverlay>
  );
}
