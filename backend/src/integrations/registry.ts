import type { IntegrationProvider } from './types.js';
import { AppError } from '../utils/errors.js';

const providers = new Map<string, IntegrationProvider>();

export function registerProvider(provider: IntegrationProvider) {
  providers.set(provider.id, provider);
}

export function getProvider(id: string): IntegrationProvider {
  const p = providers.get(id);
  if (!p) throw AppError.notFound(`Integration provider '${id}'`);
  return p;
}

export function getAllProviders(): IntegrationProvider[] {
  return [...providers.values()];
}
