import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { MOCK_CLAUDE_RESPONSE } from "../mocks/handlers";

// Mock @vercel/analytics — factory must not reference outer vars (hoisting)
vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock clipboard used by ShareCard copy button
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

import * as vercelAnalytics from "@vercel/analytics";
import InputForm from "@/components/InputForm";
import RecommendationCard from "@/components/RecommendationCard";
import ShareCard from "@/components/ShareCard";

const mockTrack = vi.mocked(vercelAnalytics.track);

beforeEach(() => {
  mockTrack.mockClear();
  mockPush.mockClear();
  // jsdom doesn't implement sessionStorage properly — patch it
  Object.defineProperty(window, "sessionStorage", {
    value: {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
});

// ── InputForm ────────────────────────────────────────────────────────────────

describe("InputForm analytics", () => {
  it("tracks report_generated and input_type with 'text' after text submit", async () => {
    render(<InputForm />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "some transaction data" } });
    fireEvent.submit(textarea.closest("form")!);

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith("report_generated", { input_type: "text", account_count: 1 });
      expect(mockTrack).toHaveBeenCalledWith("input_type", { type: "text" });
    });
  });

  it("tracks with input_type 'text' on success, not on error", async () => {
    server.use(
      http.post("/api/analyze", () => HttpResponse.json({ error: "oops" }, { status: 500 }))
    );
    render(<InputForm />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "data" } });
    fireEvent.submit(textarea.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("oops")).toBeInTheDocument();
    });
    expect(mockTrack).not.toHaveBeenCalled();
  });
});

// ── RecommendationCard ───────────────────────────────────────────────────────

describe("RecommendationCard analytics", () => {
  const recommendation = MOCK_CLAUDE_RESPONSE.recommendations[0];

  it("tracks affiliate_click with category and partner when CTA is clicked", () => {
    render(<RecommendationCard recommendation={recommendation} />);
    const link = screen.getByRole("link");
    fireEvent.click(link);

    expect(mockTrack).toHaveBeenCalledWith("affiliate_click", {
      category: recommendation.affiliateKey,
      partner: expect.any(String),
    });
  });

  it("tracks the correct affiliateKey as category", () => {
    render(<RecommendationCard recommendation={recommendation} />);
    fireEvent.click(screen.getByRole("link"));

    const call = mockTrack.mock.calls[0];
    expect(call[0]).toBe("affiliate_click");
    expect(call[1]!.category).toBe("electricity");
  });

  it("does not call track when there is no affiliate", () => {
    const noAffiliate = { ...recommendation, affiliateKey: "unknown_key_xyz" };
    render(<RecommendationCard recommendation={noAffiliate} />);
    // No link rendered when affiliate is null
    expect(screen.queryByRole("link")).toBeNull();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("renders specific_transactions as a list when present", () => {
    const withTransactions = {
      ...recommendation,
      specific_transactions: ["Netflix 179 kr/mnd", "Viaplay 269 kr/mnd"],
    };
    render(<RecommendationCard recommendation={withTransactions} />);
    expect(screen.getByText("Netflix 179 kr/mnd")).toBeInTheDocument();
    expect(screen.getByText("Viaplay 269 kr/mnd")).toBeInTheDocument();
  });

  it("does not render transaction list when specific_transactions is empty", () => {
    const withEmpty = { ...recommendation, specific_transactions: [] };
    const { container } = render(<RecommendationCard recommendation={withEmpty} />);
    expect(container.querySelector("ul")).toBeNull();
  });

  it("does not render transaction list when specific_transactions is absent", () => {
    const withoutField = { ...recommendation };
    (withoutField as unknown as { specific_transactions: undefined }).specific_transactions = undefined;
    const { container } = render(<RecommendationCard recommendation={withoutField as typeof recommendation} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});

// ── ShareCard ────────────────────────────────────────────────────────────────

describe("ShareCard analytics", () => {
  it("tracks share_action with method copy_link when copy button is clicked", async () => {
    render(<ShareCard result={MOCK_CLAUDE_RESPONSE} />);
    const btn = screen.getByRole("button", { name: /kopier lenke/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith("share_action", { method: "copy_link" });
    });
  });

  it("tracks share_action with method whatsapp when WhatsApp button is clicked", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ShareCard result={MOCK_CLAUDE_RESPONSE} />);
    const btn = screen.getByRole("button", { name: /whatsapp/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith("share_action", { method: "whatsapp" });
    });
    openSpy.mockRestore();
  });
});
