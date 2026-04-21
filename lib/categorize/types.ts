export const CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Transport",
  "Car",
  "Utilities",
  "Insurance",
  "Investments & Savings",
  "Rent/Mortgage",
  "Home",
  "Kids",
  "Pet",
  "Personal Care",
  "Shopping",
  "Entertainment",
  "Health & Fitness",
  "Travel",
  "Subscriptions",
  "Cash",
  "Charity",
  "Income",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Display-only grouping for the Uncategorised-panel <select>. Categories
// stay flat in the data model; the group layer just makes the picker
// scannable (<optgroup> renders natural section headers in the native
// dropdown across browsers/OSes).
export const CATEGORY_GROUPS: { label: string; categories: Category[] }[] = [
  {
    label: "Housing",
    categories: ["Rent/Mortgage", "Home", "Utilities"],
  },
  {
    label: "Food",
    categories: ["Groceries", "Dining Out"],
  },
  {
    label: "Getting around",
    categories: ["Transport", "Car", "Travel"],
  },
  {
    label: "Wellbeing",
    categories: ["Health & Fitness", "Personal Care", "Kids", "Pet"],
  },
  {
    label: "Money & giving",
    categories: [
      "Insurance",
      "Investments & Savings",
      "Charity",
      "Income",
    ],
  },
  {
    label: "Discretionary",
    categories: ["Shopping", "Entertainment", "Subscriptions"],
  },
  {
    label: "Other",
    categories: ["Cash", "Other"],
  },
];

export interface MerchantRule {
  match: string;
  pattern?: RegExp;
  paymentType?: string;
  category: Category;
  appliesTo?: "debit" | "credit" | "both";
  priority?: number;
}
