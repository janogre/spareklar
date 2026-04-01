import { describe, it, expect } from "vitest";
import { getAffiliate, affiliates } from "@/lib/affiliates";

describe("affiliates config", () => {
  it("loads all 4 affiliate categories", () => {
    expect(Object.keys(affiliates)).toHaveLength(4);
    expect(affiliates).toHaveProperty("electricity");
    expect(affiliates).toHaveProperty("loans");
    expect(affiliates).toHaveProperty("mobile");
    expect(affiliates).toHaveProperty("insurance");
  });

  it("electricity affiliate has correct shape", () => {
    const aff = affiliates.electricity;
    expect(aff.partnerName).toBe("Tibber");
    expect(aff.url).toContain("tibber");
    expect(aff.url).toContain("spareklar");
    expect(aff.cta).toBeTruthy();
    expect(aff.category).toBeTruthy();
  });

  it("loans affiliate has correct shape", () => {
    const aff = affiliates.loans;
    expect(aff.partnerName).toBe("Lendo");
    expect(aff.url).toContain("lendo.no");
    expect(aff.url).toContain("spareklar");
  });

  it("mobile affiliate has correct shape", () => {
    const aff = affiliates.mobile;
    expect(aff.partnerName).toBe("Telepris");
    expect(aff.url).toContain("telepris.no");
    expect(aff.url).toContain("spareklar");
  });

  it("insurance affiliate has correct shape", () => {
    const aff = affiliates.insurance;
    expect(aff.partnerName).toBe("Uno");
    expect(aff.url).toContain("uno.no");
    expect(aff.url).toContain("spareklar");
  });

  it("all affiliates have Norwegian CTA text", () => {
    for (const [, aff] of Object.entries(affiliates)) {
      expect(typeof aff.cta).toBe("string");
      expect(aff.cta.length).toBeGreaterThan(0);
    }
  });
});

describe("getAffiliate", () => {
  it("returns electricity affiliate by key", () => {
    const aff = getAffiliate("electricity");
    expect(aff).not.toBeNull();
    expect(aff?.partnerName).toBe("Tibber");
  });

  it("returns loans affiliate by key", () => {
    const aff = getAffiliate("loans");
    expect(aff).not.toBeNull();
    expect(aff?.partnerName).toBe("Lendo");
  });

  it("returns mobile affiliate by key", () => {
    const aff = getAffiliate("mobile");
    expect(aff).not.toBeNull();
    expect(aff?.partnerName).toBe("Telepris");
  });

  it("returns insurance affiliate by key", () => {
    const aff = getAffiliate("insurance");
    expect(aff).not.toBeNull();
    expect(aff?.partnerName).toBe("Uno");
  });

  it("returns null for unknown key", () => {
    expect(getAffiliate("unknown")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(getAffiliate(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getAffiliate("")).toBeNull();
  });
});
