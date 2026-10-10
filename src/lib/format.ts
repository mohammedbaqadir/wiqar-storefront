/** Arabic-Indic digits and money, the way the store's shoppers read numbers. */
export const toArabicDigits = (input: number | string): string =>
  String(input).replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

export const money = (amount: number): string =>
  `${toArabicDigits(amount.toLocaleString('en-US'))} ر.س`;

/** The one red flag: a single piece is not "١ قطع". */
export const stockLabel = (count: number): string =>
  count === 1 ? 'آخر قطعة' : `آخر ${toArabicDigits(count)} قطع`;
