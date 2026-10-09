import { binancePairFor, isSupportedCryptoSymbol } from "./crypto-symbols";

describe("crypto-symbols", () => {
  it("recognizes supported symbols case-insensitively", () => {
    expect(isSupportedCryptoSymbol("btc")).toBe(true);
    expect(isSupportedCryptoSymbol("ETH")).toBe(true);
    expect(isSupportedCryptoSymbol("DOGE")).toBe(true);
    expect(isSupportedCryptoSymbol("NOTCOIN")).toBe(false);
  });

  it("builds the Binance trading pair", () => {
    expect(binancePairFor("btc", "usdt")).toBe("BTCUSDT");
  });
});
