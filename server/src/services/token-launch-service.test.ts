import { describe, expect, mock, test } from 'bun:test';
import {
  TOKEN_MANAGER2_ADDRESS,
  type LaunchFormInput,
} from '@agentbiu/shared';
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from 'viem';
import {
  computeLaunchCreationFee,
  computeLaunchRequiredAllowance,
  extractLaunchedTokenAddress,
  TokenLaunchService,
  type TokenLaunchFourMemeClient,
  type TokenLaunchNft8004Service,
  type TokenLaunchPublicClient,
  type TokenLaunchWalletClient,
} from './token-launch-service';

const tokenCreateEvent = parseAbiItem(
  'event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)',
);
const privateKey =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as const;

function buildTokenCreateLog(token: `0x${string}`) {
  return {
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
      ['0x1111111111111111111111111111111111111111', token, 1n, 'Agent BIU', 'BIU', 1_000_000_000n, 123n, 456n],
    ),
  };
}

function buildTestDeps() {
  const publicClient: TokenLaunchPublicClient = {
    async readContract(args) {
      if (args.functionName === '_launchFee') return 1000n;
      if (args.functionName === '_tradingFeeRate') return 250n;
      if (args.functionName === 'decimals') return 18;
      if (args.functionName === 'allowance') return 0n;
      throw new Error(`unexpected readContract call: ${args.functionName}`);
    },
    async waitForTransactionReceipt() {
      return { status: 'success', logs: [buildTokenCreateLog('0x2222222222222222222222222222222222222222')] };
    },
  };

  const walletWrite = mock(async (_args: Parameters<TokenLaunchWalletClient['writeContract']>[0]) => '0xabc' as const);
  const walletClient: TokenLaunchWalletClient = {
    writeContract: walletWrite,
  };

  const fourMemeClient = {
    async fetchPublicConfig() {
      return [{ symbol: 'BNB', status: 'PUBLISH' }];
    },
    async generateNonce(address: string) {
      return { nonce: 'nonce-1', message: `sign:${address}` };
    },
    async loginWithSignature() {
      return { accessToken: 'access-token' };
    },
    async uploadImage() {
      return 'https://example.com/token.png';
    },
    async createToken() {
      return {
        createArg: 'YQ==',
        signature: 'Yg==',
      };
    },
    pickRaisedToken(configs: { symbol: string; status?: string }[]) {
      return configs[0]!;
    },
    buildCreateBody(form: LaunchFormInput) {
      return {
        preSale: form.preSale,
      };
    },
  } as unknown as TokenLaunchFourMemeClient;

  const nft8004Service = {
    ensureIdentity: mock(async () => {
      return;
    }),
  } as unknown as TokenLaunchNft8004Service;

  return {
    publicClient,
    walletClientFactory: () => walletClient,
    walletWrite,
    fourMemeClient,
    nft8004Service,
  };
}

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

  test('prepareLaunchWithAccessToken decodes base64 create payloads', async () => {
    const deps = buildTestDeps();
    const service = new TokenLaunchService({
      publicClient: deps.publicClient,
      fourMemeClient: deps.fourMemeClient,
      nft8004Service: deps.nft8004Service,
    });

    const result = await service.prepareLaunchWithAccessToken(
      'access-token',
      {
        name: 'Agent BIU',
        shortName: 'BIU',
        desc: 'hello',
        label: 'Meme',
        webUrl: '',
        twitterUrl: '',
        telegramUrl: '',
        preSale: '0',
        feePlan: false,
        raisedTokenSymbol: 'BNB',
        agentName: 'Agent BIU',
        agentImageUrl: '',
        agentDescription: '',
      },
      new File(['demo'], 'logo.png', { type: 'image/png' }),
      { launchFee: 1000n, tradingFeeRate: 250n },
    );

    expect(result.createArg).toBe('0x61');
    expect(result.signature).toBe('0x62');
    expect(result.creationFeeWei).toBe('1000');
  });

  test('launchWithPrivateKey uses injected services end to end', async () => {
    const deps = buildTestDeps();
    const service = new TokenLaunchService(deps);

    const result = await service.launchWithPrivateKey(privateKey, {
      name: 'Agent BIU',
      shortName: 'BIU',
      desc: 'hello',
      label: 'Meme',
      webUrl: '',
      twitterUrl: '',
      telegramUrl: '',
      preSale: '0',
      feePlan: false,
      raisedTokenSymbol: 'BNB',
      agentName: 'Agent BIU',
      agentImageUrl: '',
      agentDescription: '',
    }, new File(['demo'], 'logo.png', { type: 'image/png' }));

    expect(deps.walletWrite).toHaveBeenCalledTimes(1);
    expect(result.createArg).toBe('0x61');
    expect(result.signature).toBe('0x62');
    expect(result.tokenAddress).toBe('0x2222222222222222222222222222222222222222');
    expect(result.walletAddress).toBe('0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A');
    expect(deps.nft8004Service.ensureIdentity).toHaveBeenCalledTimes(1);
  });
});
