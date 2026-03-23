/**
 * Analytics utility for tracking user interactions.
 * Uses the built-in Manus analytics API.
 */

const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const WEBSITE_ID = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

/**
 * Track an event in analytics.
 * Sends data to the Manus analytics backend.
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (!ANALYTICS_ENDPOINT || !WEBSITE_ID) {
    console.warn("[Analytics] Endpoint or website ID not configured");
    return;
  }

  try {
    const payload = {
      website_id: WEBSITE_ID,
      event_name: event.name,
      event_data: event.properties || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
    };

    // Send analytics event asynchronously (fire and forget)
    navigator.sendBeacon(
      ANALYTICS_ENDPOINT,
      JSON.stringify(payload)
    );
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Track walkthrough step completion.
 */
export function trackWalkthroughStep(
  step: "form_start" | "form_complete" | "ai_generation_start" | "ai_generation_complete" | "pdf_view",
  metadata?: Record<string, string | number | boolean>
): void {
  trackEvent({
    name: `walkthrough_${step}`,
    properties: {
      timestamp: Date.now(),
      ...metadata,
    },
  });
}

/**
 * Track form field changes.
 */
export function trackFormChange(field: string, value: string): void {
  trackEvent({
    name: "form_field_changed",
    properties: {
      field,
      value_length: value.length,
    },
  });
}

/**
 * Track PDF download.
 */
export function trackPdfDownload(trade: string): void {
  trackEvent({
    name: "pdf_downloaded",
    properties: {
      trade,
    },
  });
}

/**
 * Track copy-to-clipboard action.
 */
export function trackCopyToClipboard(): void {
  trackEvent({
    name: "form_data_copied",
  });
}

/**
 * Track CTA button click.
 */
export function trackCtaClick(ctaType: "pricing" | "get_started" | "login"): void {
  trackEvent({
    name: `cta_clicked`,
    properties: {
      cta_type: ctaType,
    },
  });
}
