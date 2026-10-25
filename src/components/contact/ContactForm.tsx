"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { profile } from "@/data/profile";

type Status = "idle" | "sending" | "success" | "error";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (String(data.get("name") ?? "").trim().length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(String(data.get("email") ?? "").trim())) errors.email = "Please enter a valid email address.";
  if (String(data.get("message") ?? "").trim().length < 10) errors.message = "Please write at least 10 characters.";
  return errors;
}

const field =
  "mt-2 w-full rounded-lg border bg-ink/60 px-3.5 py-2.5 text-fg placeholder:text-faint transition-colors duration-300 focus:border-accent focus:outline-none";

/** Posts to the Formspree endpoint used by the previous site. */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`);
      first?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(profile.formEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const describe = (name: keyof Errors) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form
      action={profile.formEndpoint}
      method="POST"
      noValidate
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-panel/50 p-6 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm text-soft">
            Name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describe("name")}
            className={`${field} ${errors.name ? "border-danger" : "border-line"}`}
          />
          {errors.name ? (
            <p id="name-error" className="mt-1.5 text-xs text-danger">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="email" className="text-sm text-soft">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describe("email")}
            className={`${field} ${errors.email ? "border-danger" : "border-line"}`}
          />
          {errors.email ? (
            <p id="email-error" className="mt-1.5 text-xs text-danger">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="subject" className="text-sm text-soft">
          Subject <span className="text-faint">(optional)</span>
        </label>
        <input id="subject" name="subject" className={`${field} border-line`} />
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="text-sm text-soft">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describe("message")}
          className={`${field} resize-y ${errors.message ? "border-danger" : "border-line"}`}
        />
        {errors.message ? (
          <p id="message-error" className="mt-1.5 text-xs text-danger">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot recognised by Formspree; hidden from people and assistive tech. */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-ink transition-opacity duration-300 disabled:opacity-60"
        >
          {status === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {status === "success" ? <span className="text-accent">Thanks — your message was sent. I&apos;ll reply by email.</span> : null}
          {status === "error" ? (
            <span className="text-danger">
              Something went wrong. Please try again, or email{" "}
              <a href={`mailto:${profile.email}`} className="underline">
                {profile.email}
              </a>
              .
            </span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
