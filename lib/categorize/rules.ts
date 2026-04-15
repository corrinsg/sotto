import type { MerchantRule } from "./types";

export const STARTER_RULES: MerchantRule[] = [
  // Groceries
  { match: "ASDA", category: "Groceries" },
  { match: "WAITROSE", category: "Groceries" },
  { match: "SAINSBURYS", category: "Groceries" },
  { match: "TESCO STORES", category: "Groceries", priority: 1 },
  { match: "ALDI", category: "Groceries" },
  { match: "MARKS & SPENCER", category: "Groceries" },
  { match: "MARKS&SPENCER", category: "Groceries" },
  { match: "NAZAR FOOD", category: "Groceries" },
  { match: "MAJESTIC WINE", category: "Groceries" },

  // Dining Out
  { match: "ITSU", category: "Dining Out" },
  { match: "PRET A MANGER", category: "Dining Out" },
  { match: "COSTA COFFEE", category: "Dining Out" },
  { match: "COSTA COLLECT", category: "Dining Out" },
  { match: "MCDONALDS", category: "Dining Out" },
  { match: "DELIVEROO", category: "Dining Out" },
  { match: "WETHERSPOON", category: "Dining Out" },
  { match: "BURGER KIN", category: "Dining Out" },
  { match: "RED THAI", category: "Dining Out" },
  { match: "TARO JAPANESE", category: "Dining Out" },
  { match: "SUSHI", category: "Dining Out" },
  { match: "JOE THE JUICE", category: "Dining Out" },
  { match: "MAOZ", category: "Dining Out" },
  { match: "CAFE BOHEME", category: "Dining Out" },
  { match: "EATVIET", category: "Dining Out" },
  { match: "EAGLE HOUSE", category: "Dining Out" },
  { match: "RAVE COFFEE", category: "Dining Out" },
  { match: "MUSEUM TAVERN", category: "Dining Out" },
  { match: "LUSH COFFEE", category: "Dining Out" },
  { match: "PHILIPPE CONTI", category: "Dining Out" },
  { match: "LA PORCHETTA", category: "Dining Out" },
  { match: "GEORGE STREET SOCI", category: "Dining Out" },
  { match: "SNOOZZZE COFFE", category: "Dining Out" },
  { match: "VON CRUMB", category: "Dining Out" },
  { match: "DINNER LADIES", category: "Dining Out" },
  { match: "NOVIELLOS", category: "Dining Out" },
  { match: "YE OLDE FIGHTI", category: "Dining Out" },
  { match: "DELIGHT BISTRO", category: "Dining Out" },
  { match: "RED LION", category: "Dining Out" },
  { match: "TIFFIN TIN", category: "Dining Out" },
  { match: "PIZZAHUT", category: "Dining Out" },
  { match: "PIZZA HUT", category: "Dining Out" },

  // Transport — public transit, taxis, ride-hailing
  { match: "TFL TRAVEL", category: "Transport" },
  { match: "TFL.GOV", category: "Transport" },
  { match: "UBR*", category: "Transport" },
  { match: "UBER UK RIDES", category: "Transport", priority: 1 },
  { match: "UBER", category: "Transport" },
  { match: "NATIONAL RAIL", category: "Transport" },
  { match: "TRAINLINE", category: "Transport" },
  { match: "BOLT.EU", category: "Transport" },

  // Car — fuel, parking, servicing, breakdown cover
  { match: "SHELL ", category: "Car" },
  { match: "ESSO", category: "Car" },
  { match: "TEXACO", category: "Car" },
  { match: "ASDA PETROL", category: "Car", priority: 2 },
  { match: "TESCO PETROL", category: "Car", priority: 2 },
  { match: "SAINSBURYS PETROL", category: "Car", priority: 2 },
  { match: "MORRISONS PETROL", category: "Car", priority: 2 },
  // BP petrol stations — word-boundary pattern so "BP " doesn't swallow other merchants
  { match: "BP", pattern: /\bBP\s/, category: "Car" },
  { match: "PAYBYPHONE", category: "Car" },
  { match: "MIPERMIT", category: "Car" },
  { match: "RINGGO", category: "Car" },
  { match: "JUSTPARK", category: "Car" },
  { match: "NCP ", category: "Car" },
  { match: "HALFORDS", category: "Car" },
  { match: "KWIK FIT", category: "Car" },
  { match: "KWIK-FIT", category: "Car" },

  // Utilities
  { match: "OCTOPUS", category: "Utilities" },
  { match: "AFFINITY WATER", category: "Utilities" },
  { match: "AQUISS", category: "Utilities" },
  { match: "1PMOBILE", category: "Utilities" },
  { match: "LB OF BARNET", category: "Utilities" },
  { match: "WOODLAND TRUST", category: "Utilities" },

  // Insurance
  { match: "AGEAS", category: "Insurance" },
  { match: "AVIVA", category: "Insurance" },
  { match: "ADMIRAL", category: "Insurance" },
  { match: "DIRECT LINE", category: "Insurance" },
  { match: "LV=", category: "Insurance" },
  { match: "HASTINGS DIRECT", category: "Insurance" },
  { match: "MORE THAN", category: "Insurance" },
  { match: "CHURCHILL", category: "Insurance" },
  { match: "PINNACLE INS", category: "Insurance" },

  // Cash withdrawals — matched on HSBC's ATM payment type code
  { match: "", paymentType: "ATM", category: "Cash", priority: 10 },

  // Subscriptions
  { match: "NETFLIX", category: "Subscriptions" },
  { match: "APPLE.COM/BILL", category: "Subscriptions" },
  { match: "YOUTUBEPREM", category: "Subscriptions" },
  { match: "LINKEDIN", category: "Subscriptions" },
  { match: "CLAUDE.AI", category: "Subscriptions" },
  { match: "AWS EMEA", category: "Subscriptions" },
  { match: "DOCHUB", category: "Subscriptions" },
  { match: "PURE GYM", category: "Subscriptions" },
  { match: "WEWORK", category: "Subscriptions" },

  // Shopping
  { match: "AMAZON", category: "Shopping" },
  { match: "AMZNMKTPLACE", category: "Shopping" },
  { match: "AMZNMktplace", category: "Shopping" },
  { match: "VINTED", category: "Shopping" },
  { match: "NEXT ", category: "Shopping" },
  { match: "PRIMARK", category: "Shopping" },
  { match: "B&M ", category: "Shopping" },
  { match: "SPORTSDIRECT", category: "Shopping" },
  { match: "ALIEXPRESS", category: "Shopping" },
  { match: "WORLDOFBOOKS", category: "Shopping" },
  { match: "BOOTS", category: "Shopping" },
  { match: "CANCER RESEARCH", category: "Shopping" },
  { match: "IHERB", category: "Shopping" },

  // Entertainment
  { match: "SOHO THEATRE", category: "Entertainment" },
  { match: "SOUTHBANK CENTRE", category: "Entertainment" },
  { match: "BRITISH MUSEUM", category: "Entertainment" },
  { match: "HOLLYWOOD BOWL", category: "Entertainment" },

  // Kids — after-school, childcare, schools, kids' activities
  { match: "KORU KIDS", category: "Kids" },
  { match: "ISRAELI SC", category: "Kids" },
  { match: "MOSS HALL INFANT", category: "Kids" },
  { match: "SOTOPA", category: "Kids" },

  // Home — cleaner, gardener, handyperson, appliance repair
  { match: "VIORICA", category: "Home" },
  { match: "APPLIANCE FIX", category: "Home" },

  // Health
  { match: "FINCHLEY DENTAL", category: "Health" },
  { match: "EAR WAX", category: "Health" },
  { match: "BUPA", category: "Health", appliesTo: "credit" },
  { match: "SHEMESH", category: "Health" },

  // Pet — food, grooming, vet, boarding
  { match: "PETS AT HOME", category: "Pet" },
  { match: "TESCO PET", category: "Pet" },
  { match: "HALO DOGS", category: "Pet" },
  { match: "OAKLEIGH GROOMS", category: "Pet" },
  { match: "PDSA", category: "Pet" },
  { match: "VETS4PETS", category: "Pet" },
  { match: "ROVER", category: "Pet" },

  // Travel
  { match: "LOT AIRLINE", category: "Travel" },
  { match: "BUTLINS", category: "Travel" },
  { match: "ENGLISH HERITAGE", category: "Travel" },
  { match: "HERTFORDSHIREZOO", category: "Travel" },
  { match: "HERTFORDSHIRE ZOO", category: "Travel" },

  // Rent/Mortgage
  { match: "QINGUO", category: "Rent/Mortgage" },

  // Income
  { match: "CHAINLINK LABS", category: "Income", appliesTo: "credit" },
  { match: "SKIPPR", category: "Income", appliesTo: "credit" },
];
