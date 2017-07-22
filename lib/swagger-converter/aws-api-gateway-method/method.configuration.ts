import { HttpVerbs, AuthorizationTypes } from './index';

export interface ApiMethodConfiguration {
    name: string;
    serviceName: string;
    resourceName?: string;
    httpVerb: HttpVerbs;
    authorizationType: AuthorizationTypes;
}
