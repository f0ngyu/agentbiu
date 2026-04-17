import { describe, expect, test } from 'bun:test';
import { TOKEN_MANAGER2_ADDRESS } from '@agentbiu/shared';
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from 'viem';
import {
  computeLaunchCreationFee,
  computeLaunchRequiredAllowance,
  extractLaunchedTokenAddress,
} from './token-launch-service';

const tokenCreateEvent = parseAbiItem(
  'event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)',
);

describe('token launch helpers', () => {
  test('extracts token address from TokenCreate logs', () => {
    const creator = '0x1111111111111111111111111111111111111111' as const;
    const token = '0x2222222222222222222222222222222222222222' as const;
    const log = {
      address: TOKEN_MANAGER2_ADDRESS,
      topics: encodeEventTopics({
        abi: [tokenCreateEvent],
        eventName: 'TokenCreate',
      }) as readonly `0x${string}`[],
      data: encodeAbiParameters(
        [
          { type: 'address', name: 'creator' },
          { type: 'address', name: 'token' },
          { type: 'uint256', name: 'requestId' },
          { type: 'string', name: 'name' },
          { type: 'string', name: 'symbol' },
          { type: 'uint256', name: 'totalSupply' },
          { type: 'uint256', name: 'launchTime' },
          { type: 'uint256', name: 'launchFee' },
        ],
        [creator, token, 1n, 'Agent BIU', 'BIU', 1_000_000_000n, 123n, 456n],
      ),
    };

    expect(extractLaunchedTokenAddress([log])).toBe(token);
  });

  test('computes required allowance including trading fee', () => {
    expect(computeLaunchRequiredAllowance('1.5', 18, 250n)).toBe(1537500000000000000n);
  });

  test('computes BNB creation fee without floating point loss', () => {
    expect(computeLaunchCreationFee(1000n, 'BNB', '1.234567890123456789', 250n)).toBe(1265432087376544208n);
  });

  test('keeps non-BNB creation fee unchanged', () => {
    expect(computeLaunchCreationFee(1000n, 'USDT', '88.5', 250n)).toBe(1000n);
  });
});
