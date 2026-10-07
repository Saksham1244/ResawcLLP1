/**
 * Converts numbers into Indian English words format (Lakhs, Crores)
 * e.g. 37950 -> "Rupees Thirty Seven Thousand Nine Hundred and Fifty Only"
 */

const units = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertBelowThousand(n: number): string {
  if (n === 0) return "";
  if (n < 20) return units[n];
  if (n < 100) {
    const rem = n % 10;
    return tens[Math.floor(n / 10)] + (rem ? " " + units[rem] : "");
  }
  const hundred = Math.floor(n / 100);
  const rem = n % 100;
  return units[hundred] + " Hundred" + (rem ? " and " + convertBelowThousand(rem) : "");
}

export function numberToWordsIndian(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Rupees Zero Only";

  let num = Math.floor(Math.abs(amount));
  const parts: string[] = [];

  // Crores (1,00,00,000)
  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    parts.push(convertBelowThousand(crores) + " Crore");
    num %= 10000000;
  }

  // Lakhs (1,00,000)
  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    parts.push(convertBelowThousand(lakhs) + " Lakh");
    num %= 100000;
  }

  // Thousands (1,000)
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    parts.push(convertBelowThousand(thousands) + " Thousand");
    num %= 1000;
  }

  // Remaining below thousand
  if (num > 0) {
    parts.push(convertBelowThousand(num));
  }

  return "Rupees " + parts.join(" ").trim() + " Only";
}
