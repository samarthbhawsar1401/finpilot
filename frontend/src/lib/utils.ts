import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹";
  
  // Format with standard locale format
  const formatted = Math.abs(amount).toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
