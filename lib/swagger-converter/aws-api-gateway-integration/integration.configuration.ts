import { IntegrationTypes } from './index';

export interface IntegrationConfiguration {
    name: string;
    serviceName: string;
    resourceName?: string;
    type: IntegrationTypes;
}
