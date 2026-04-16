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

  // Dining Out — chains
  { match: "ITSU", category: "Dining Out" },
  { match: "PRET A MANGER", category: "Dining Out" },
  { match: "COSTA COFFEE", category: "Dining Out" },
  { match: "COSTA COLLECT", category: "Dining Out" },
  { match: "CAFFE NERO", category: "Dining Out" },
  { match: "CAFFENERO", category: "Dining Out" },
  { match: "STARBUCKS", category: "Dining Out" },
  { match: "GREGGS", category: "Dining Out" },
  { match: "GAIL'S", category: "Dining Out" },
  { match: "GAILS BAKERY", category: "Dining Out" },
  { match: "MCDONALDS", category: "Dining Out" },
  { match: "KFC", category: "Dining Out" },
  { match: "SUBWAY", category: "Dining Out" },
  { match: "BURGER KING", category: "Dining Out" },
  { match: "BURGER KIN", category: "Dining Out" },
  { match: "FIVE GUYS", category: "Dining Out" },
  { match: "FIVEGUYS", category: "Dining Out" },
  { match: "HONEST BURGERS", category: "Dining Out" },
  { match: "BYRON", category: "Dining Out" },
  { match: "GBK", category: "Dining Out" },
  { match: "GOURMET BURGER", category: "Dining Out" },
  { match: "NANDOS", category: "Dining Out" },
  { match: "NANDO'S", category: "Dining Out" },
  { match: "WAGAMAMA", category: "Dining Out" },
  { match: "YO SUSHI", category: "Dining Out" },
  { match: "YO! SUSHI", category: "Dining Out" },
  { match: "DISHOOM", category: "Dining Out" },
  { match: "PIZZA EXPRESS", category: "Dining Out" },
  { match: "PIZZAEXPRESS", category: "Dining Out" },
  { match: "FRANCO MANCA", category: "Dining Out" },
  { match: "ZIZZI", category: "Dining Out" },
  { match: "ASK ITALIAN", category: "Dining Out" },
  { match: "PIZZAHUT", category: "Dining Out" },
  { match: "PIZZA HUT", category: "Dining Out" },
  { match: "DOMINOS", category: "Dining Out" },
  { match: "DOMINO'S", category: "Dining Out" },
  { match: "PAPA JOHN", category: "Dining Out" },
  { match: "LEON RESTAURANT", category: "Dining Out" },
  { match: "WETHERSPOON", category: "Dining Out" },
  { match: "DELIVEROO", category: "Dining Out" },
  { match: "JUST EAT", category: "Dining Out" },
  { match: "JUSTEAT", category: "Dining Out" },
  { match: "UBER EATS", category: "Dining Out" },
  { match: "UBEREATS", category: "Dining Out" },

  // Dining Out — specific merchants from sample data
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

  // Dining Out — keyword fallbacks for the long tail
  // Low priority so specific chain/merchant rules still win when present
  { match: "RESTAURANT", category: "Dining Out", appliesTo: "debit" },
  { match: "BISTRO", category: "Dining Out", appliesTo: "debit" },
  { match: "PIZZERIA", category: "Dining Out", appliesTo: "debit" },
  { match: "GASTROPUB", category: "Dining Out", appliesTo: "debit" },
  { match: "CAFE ", category: "Dining Out", appliesTo: "debit" },
  { match: " CAFE", category: "Dining Out", appliesTo: "debit" },
  { match: "TRATTORIA", category: "Dining Out", appliesTo: "debit" },

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
  { match: "MOSS HALL", category: "Kids" },
  { match: "SOTOPA", category: "Kids" },

  // Home — cleaner, gardener, handyperson, appliance repair
  { match: "APPLIANCE FIX", category: "Home" },

  // Health
  { match: "FINCHLEY DENTAL", category: "Health & Fitness" },
  { match: "EAR WAX", category: "Health & Fitness" },
  { match: "BUPA", category: "Health & Fitness", appliesTo: "credit" },
  { match: "PURE GYM", category: "Health & Fitness" },
  { match: "PUREGYM", category: "Health & Fitness" },
  // Keyword fallbacks for pharmacies — higher priority so they beat
  // retail rules like BOOTS when the merchant name includes "pharmacy".
  { match: "PHARMACY", category: "Health & Fitness", appliesTo: "debit", priority: 2 },
  { match: "PHARMA", category: "Health & Fitness", appliesTo: "debit", priority: 2 },
  { match: "CHEMIST", category: "Health & Fitness", appliesTo: "debit", priority: 2 },

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

  // Income
  { match: "CHAINLINK LABS", category: "Income", appliesTo: "credit" },
  { match: "SKIPPR", category: "Income", appliesTo: "credit" },
];
