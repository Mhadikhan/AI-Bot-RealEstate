export type LeadInput = {
  phone?: string;
  email?: string;
  budgetMax?: number;
  preferredArea?: string;
  selectedPropertyId?: string;
  timeline?: string;
  requestedViewing?: boolean;
  requestedCallback?: boolean;
  requestedAgent?: boolean;
  paymentPreference?: string;
};

export function scoreLead(input: LeadInput) {
  let score = 0;
  const reasons: string[] = [];
  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  if (input.phone) add(15, "Phone number provided");
  if (input.email) add(5, "Email provided");
  if (input.budgetMax) add(10, "Budget defined");
  if (input.preferredArea) add(5, "Preferred area selected");
  if (input.selectedPropertyId) add(10, "Specific property selected");
  if (input.requestedViewing) add(20, "Viewing requested");
  if (input.requestedCallback) add(15, "Callback requested");
  if (input.requestedAgent) add(15, "Human agent requested");
  if (["Immediately", "Within 30 days"].includes(input.timeline || "")) add(15, "High urgency timeline");
  if (["Mortgage", "Installment plan", "Need guidance"].includes(input.paymentPreference || "")) add(5, "Financing guidance requested");

  return {
    score,
    temperature: score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD",
    reasons
  } as const;
}
