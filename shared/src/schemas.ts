import { z } from 'zod';
import { TOKEN_LABELS } from './constants';

export const hexPrivateKeySchema = z
  .string()
  .trim()
  .regex(/^(0x)?[0-9a-fA-F]{64}$/, '私钥格式不正确');

export const addressSchema = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{40}$/, '钱包地址格式不正确');

export const urlSchema = z
  .union([z.literal(''), z.string().trim().url('请输入有效链接')])
  .default('');

export const launchFormSchema = z.object({
  name: z.string().trim().min(1, '请输入代币名称').max(40, '代币名称不能超过 40 个字符'),
  shortName: z.string().trim().min(1, '请输入代币简称').max(20, '代币简称不能超过 20 个字符'),
  desc: z.string().trim().min(1, '请输入描述').max(280, '描述不能超过 280 个字符'),
  label: z.enum(TOKEN_LABELS),
  webUrl: urlSchema,
  twitterUrl: urlSchema,
  telegramUrl: urlSchema,
  preSale: z.string().trim().default('0'),
  feePlan: z.boolean().default(false),
  raisedTokenSymbol: z.string().trim().default('BNB'),
  agentName: z.string().trim().min(1, '请输入 8004 Agent 名称').max(40, 'Agent 名称不能超过 40 个字符'),
  agentImageUrl: urlSchema,
  agentDescription: z.string().trim().max(200, 'Agent 描述不能超过 200 个字符').default(''),
});

export const privateKeySessionSchema = z.object({
  privateKey: hexPrivateKeySchema,
});

export const addressPayloadSchema = z.object({
  address: addressSchema,
});

export const walletLoginSchema = z.object({
  address: addressSchema,
  signature: z.string().trim().min(1, '签名不能为空'),
});

export type LaunchFormInput = z.infer<typeof launchFormSchema>;
export type PrivateKeySessionInput = z.infer<typeof privateKeySessionSchema>;
export type AddressPayload = z.infer<typeof addressPayloadSchema>;
export type WalletLoginInput = z.infer<typeof walletLoginSchema>;
