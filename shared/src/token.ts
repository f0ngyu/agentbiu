import { TOKEN_MANAGER2_ADDRESS } from './constants';
import { decodeEventLog, parseAbi, parseUnits } from 'viem';

export type TokenReceiptLog = {
  address: string;
  data: `0x${string}`;
  topics: readonly `0x${string}`[];
};

const tokenCreateEventAbi = parseAbi([
  'event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)',
]);

export function extractTokenAddressFromLogs(
  logs: TokenReceiptLog[],
  managerAddress: string = TOKEN_MANAGER2_ADDRESS,
): string | null {
  for (const log of logs) {
    if (log.address.toLowerCase() !== managerAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: tokenCreateEventAbi,
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });
      if (decoded.eventName === 'TokenCreate') {
        return (decoded.args as { token: string }).token;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function normalizeDecimalInput(value: string | number) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(value);
  }
  return value.trim();
}

export function parseTokenAmount(value: string | number, decimals: number): bigint {
  const normalizedValue = normalizeDecimalInput(value);
  if (!normalizedValue) return 0n;
  return parseUnits(normalizedValue, decimals);
}

export function computeRequiredAllowance(preSaleUnits: bigint, feeRate: bigint): bigint {
  return preSaleUnits + (preSaleUnits * feeRate) / 10000n;
}

export function computeCreationFeeWei(
  launchFee: bigint,
  raisedSymbol: string,
  preSaleValue: string | number,
  tradingFeeRate: bigint,
) {
  if (raisedSymbol !== 'BNB') return launchFee;

  const preSaleWei = parseTokenAmount(preSaleValue, 18);
  if (preSaleWei <= 0n) return launchFee;

  return launchFee + computeRequiredAllowance(preSaleWei, tradingFeeRate);
}
