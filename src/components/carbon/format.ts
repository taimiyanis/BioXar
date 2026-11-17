/** Fixed decimals with thousands separators: fmtNum(1234.5, 1) = "1,234.5". */
export const fmtNum = (n: number, d = 1) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
