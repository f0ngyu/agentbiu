import type { LaunchFormInput } from './schemas';

export const LAUNCH_FORM_FIELD_NAMES = [
  'name',
  'shortName',
  'desc',
  'label',
  'webUrl',
  'twitterUrl',
  'telegramUrl',
  'preSale',
  'feePlan',
  'raisedTokenSymbol',
  'agentName',
  'agentImageUrl',
  'agentDescription',
] as const satisfies readonly (keyof LaunchFormInput)[];

export type LaunchFormFieldName = (typeof LAUNCH_FORM_FIELD_NAMES)[number];

type FormDataReader = {
  get(name: string): string | Blob | null;
};

type FormDataWriter = {
  set(name: string, value: string | Blob): void;
};

export function serializeLaunchForm(input: LaunchFormInput): Record<LaunchFormFieldName, string> {
  return {
    name: input.name,
    shortName: input.shortName,
    desc: input.desc,
    label: input.label,
    webUrl: input.webUrl,
    twitterUrl: input.twitterUrl,
    telegramUrl: input.telegramUrl,
    preSale: input.preSale,
    feePlan: String(input.feePlan),
    raisedTokenSymbol: input.raisedTokenSymbol,
    agentName: input.agentName,
    agentImageUrl: input.agentImageUrl,
    agentDescription: input.agentDescription,
  };
}

export function appendLaunchFormFields(target: FormDataWriter, input: LaunchFormInput) {
  const serialized = serializeLaunchForm(input);
  for (const fieldName of LAUNCH_FORM_FIELD_NAMES) {
    target.set(fieldName, serialized[fieldName]);
  }
}

export function readLaunchFormFields(source: FormDataReader): LaunchFormInput {
  return {
    name: String(source.get('name') || ''),
    shortName: String(source.get('shortName') || ''),
    desc: String(source.get('desc') || ''),
    label: String(source.get('label') || 'Meme') as LaunchFormInput['label'],
    webUrl: String(source.get('webUrl') || ''),
    twitterUrl: String(source.get('twitterUrl') || ''),
    telegramUrl: String(source.get('telegramUrl') || ''),
    preSale: String(source.get('preSale') || '0'),
    feePlan: String(source.get('feePlan') || 'false') === 'true',
    raisedTokenSymbol: String(source.get('raisedTokenSymbol') || 'BNB'),
    agentName: String(source.get('agentName') || ''),
    agentImageUrl: String(source.get('agentImageUrl') || ''),
    agentDescription: String(source.get('agentDescription') || ''),
  };
}
