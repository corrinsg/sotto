export const CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Transport",
  "Car",
  "Utilities",
  "Insurance",
  "Rent/Mortgage",
  "Home",
  "Kids",
  "Pet",
  "Shopping",
  "Entertainment",
  "Health",
  "Travel",
  "Subscriptions",
  "Cash",
  "Income",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface MerchantRule {
  match: string;
  pattern?: RegExp;
  paymentType?: string;
  category: Category;
  appliesTo?: "debit" | "credit" | "both";
  priority?: number;
}
