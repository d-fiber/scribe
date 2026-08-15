// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

// This file is auto-generated do not edit manually.
// Run: poppin gen code

export class Env {
  protected static get(name: string): string {
    const value = Deno.env.get(name);
    if (!value)
      throw new Error("Missing required environment variable: " + name);
    return value;
  }

  static get PORT(): number {
    return parseInt(Deno.env.get("PORT") ?? "3000");
  }

  static get WORKER_ENDPOINT(): string {
    return this.get("WORKER_ENDPOINT");
  }

  static get WORKER_CALLBACK_URL(): string {
    return this.get("WORKER_CALLBACK_URL");
  }

  static get WORKER_CALLBACK_PORT(): number {
    return parseInt(this.get("WORKER_CALLBACK_PORT"));
  }

  static get SMTP_ACCOUNT_HOST(): string {
    return this.get("SMTP_ACCOUNT_HOST");
  }

  static get SMTP_ACCOUNT_PORT(): number {
    return parseInt(this.get("SMTP_ACCOUNT_PORT"));
  }

  static get SMTP_ACCOUNT_USER(): string {
    return this.get("SMTP_ACCOUNT_USER");
  }

  static get SMTP_ACCOUNT_PASS(): string {
    return this.get("SMTP_ACCOUNT_PASS");
  }

  static get SMTP_NOREPLY_HOST(): string {
    return this.get("SMTP_NOREPLY_HOST");
  }

  static get SMTP_NOREPLY_PORT(): number {
    return parseInt(this.get("SMTP_NOREPLY_PORT"));
  }

  static get SMTP_NOREPLY_USER(): string {
    return this.get("SMTP_NOREPLY_USER");
  }

  static get SMTP_NOREPLY_PASS(): string {
    return this.get("SMTP_NOREPLY_PASS");
  }

  static get APP_NAME(): string {
    return this.get("APP_NAME");
  }

  static get JWT_SECRET(): string | undefined {
    return Deno.env.get("JWT_SECRET");
  }

  static get SUPABASE_URL(): string {
    return this.get("SUPABASE_URL");
  }

  static get SUPABASE_AUTH_INTERNAL_URL(): string {
    return this.get("SUPABASE_AUTH_INTERNAL_URL");
  }

  static get SUPABASE_REST_INTERNAL_URL(): string {
    return this.get("SUPABASE_REST_INTERNAL_URL");
  }

  static get SUPABASE_STORAGE_INTERNAL_URL(): string {
    return this.get("SUPABASE_STORAGE_INTERNAL_URL");
  }

  static get SUPABASE_ANON_KEY(): string {
    return this.get("SUPABASE_ANON_KEY");
  }

  static get SUPABASE_SERVICE_ROLE_KEY(): string {
    return this.get("SUPABASE_SERVICE_ROLE_KEY");
  }

  static get PENDING_TOKEN_SECRET(): string {
    return this.get("PENDING_TOKEN_SECRET");
  }

  static get VERIFY_JWT(): boolean {
    return Deno.env.get("VERIFY_JWT") === "true";
  }

  static get OPENSEARCH_URL(): string {
    return this.get("OPENSEARCH_URL");
  }

  static get INTERNAL_SECRET(): string {
    return this.get("INTERNAL_SECRET");
  }

  static get GEOCODING_API_KEY(): string {
    return this.get("GEOCODING_API_KEY");
  }

  static get APP_URL(): string {
    return this.get("APP_URL");
  }

  static get APP_DEEPLINK_SCHEME(): string | undefined {
    return Deno.env.get("APP_DEEPLINK_SCHEME");
  }

  static get APP_IOS_STORE_URL(): string | undefined {
    return Deno.env.get("APP_IOS_STORE_URL");
  }

  static get APP_ANDROID_STORE_URL(): string | undefined {
    return Deno.env.get("APP_ANDROID_STORE_URL");
  }

  static get FCM_PROJECT_ID(): string {
    return this.get("FCM_PROJECT_ID");
  }

  static get FCM_CLIENT_EMAIL(): string {
    return this.get("FCM_CLIENT_EMAIL");
  }

  static get FCM_PRIVATE_KEY(): string {
    return this.get("FCM_PRIVATE_KEY");
  }

  static get TWILIO_ACCOUNT_SID(): string | undefined {
    return Deno.env.get("TWILIO_ACCOUNT_SID");
  }

  static get TWILIO_AUTH_TOKEN(): string | undefined {
    return Deno.env.get("TWILIO_AUTH_TOKEN");
  }

  static get TWILIO_MESSAGE_SERVICE_SID(): string | undefined {
    return Deno.env.get("TWILIO_MESSAGE_SERVICE_SID");
  }

  static get GOOGLE_CLIENT_ID(): string | undefined {
    return Deno.env.get("GOOGLE_CLIENT_ID");
  }

  static get GOOGLE_CLIENT_SECRET(): string | undefined {
    return Deno.env.get("GOOGLE_CLIENT_SECRET");
  }

  static get GOOGLE_ADDITIONAL_CLIENT_IDS(): string | undefined {
    return Deno.env.get("GOOGLE_ADDITIONAL_CLIENT_IDS");
  }

  static get APPLE_CLIENT_ID(): string | undefined {
    return Deno.env.get("APPLE_CLIENT_ID");
  }

  static get APPLE_CLIENT_SECRET(): string | undefined {
    return Deno.env.get("APPLE_CLIENT_SECRET");
  }

  static get APPLE_ADDITIONAL_CLIENT_IDS(): string | undefined {
    return Deno.env.get("APPLE_ADDITIONAL_CLIENT_IDS");
  }

  static get ADMIN_URL(): string {
    return this.get("ADMIN_URL");
  }

  static get MAIN_URL(): string {
    return this.get("MAIN_URL");
  }

  static get INTRA_URL(): string {
    return this.get("INTRA_URL");
  }

  static get HOOK_SEND_EMAIL_SECRETS(): string {
    return this.get("HOOK_SEND_EMAIL_SECRETS");
  }

  static get HOOK_SEND_SMS_SECRETS(): string {
    return this.get("HOOK_SEND_SMS_SECRETS");
  }

  static get HOOK_CUSTOM_ACCESS_TOKEN_SECRETS(): string {
    return this.get("HOOK_CUSTOM_ACCESS_TOKEN_SECRETS");
  }

  static get DEVICE_PAYLOAD_PRIVATE_KEY(): string {
    return this.get("DEVICE_PAYLOAD_PRIVATE_KEY");
  }

  static get ADMIN_APP_KEYS(): string[] {
    return this.get("ADMIN_APP_KEYS")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  static get APP_KEYS(): string[] {
    return this.get("APP_KEYS")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  static get REDIS_URL(): string {
    return this.get("REDIS_URL");
  }

  static get NATS_URL(): string {
    return this.get("NATS_URL");
  }

  static get WG_EASY_URL(): string {
    return this.get("WG_EASY_URL");
  }

  static get WG_EASY_PASSWORD(): string {
    return this.get("WG_EASY_PASSWORD");
  }

  static get WG_SUBNET_PREFIX(): string {
    return this.get("WG_SUBNET_PREFIX");
  }

  static get GORSE_URL(): string {
    return this.get("GORSE_URL");
  }

  static get GORSE_API_KEY(): string {
    return this.get("GORSE_API_KEY");
  }
}
