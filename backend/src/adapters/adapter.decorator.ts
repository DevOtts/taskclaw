import { SetMetadata } from '@nestjs/common';

export const ADAPTER_METADATA = 'ADAPTER_PROVIDER_NAME';

/**
 * Marks a class as a source adapter for a specific provider.
 * The adapter will be auto-discovered and registered in the AdapterRegistry.
 *
 * Usage:
 *   @Adapter('jira')
 *   @Injectable()
 *   export class JiraAdapter implements SourceAdapter { ... }
 */
export const Adapter = (providerName: string) =>
  SetMetadata(ADAPTER_METADATA, providerName);
