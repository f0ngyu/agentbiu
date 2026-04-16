import { config } from 'dotenv';
import {
  BSC_CHAIN_ID,
  BSC_CHAIN_NAME,
  BSC_RPC_URL,
  EIP8004_NFT_ADDRESS,
  TOKEN_MANAGER2_ADDRESS,
} from '@agentbiu/shared';

config({ path: '../.env' });
config();

export const appEnv = {
  port: Number(process.env.PORT || 3000),
  bscRpcUrl: process.env.BSC_RPC_URL || BSC_RPC_URL,
  privateKey: process.env.PRIVATE_KEY || '',
  chainId: BSC_CHAIN_ID,
  chainName: BSC_CHAIN_NAME,
  tokenManager2Address: TOKEN_MANAGER2_ADDRESS,
  eip8004Address:
    process.env['8004_NFT_ADDRESS'] || process.env.EIP8004_NFT_ADDRESS || EIP8004_NFT_ADDRESS,
};
