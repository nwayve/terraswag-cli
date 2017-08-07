// vendor
import { compile } from 'handlebars';
import { mapValues } from 'lodash';

// project
import { HttpVerbs, AuthorizationTypes } from './index';

const TEMPLATE = `\
resource "aws_api_gateway_method" "{{method.name}}" {
  rest_api_id   = "\${aws_api_gateway_rest_api.{{method.serviceName}}.id}"
  resource_id   = "\${aws_api_gateway_rest_api.{{method.serviceName}}.root_resource_id}"
  http_method   = "{{method.httpVerb}}"
  authorization = "{{method.authorizationType}}"
}
`;

const RESOURCE_TEMPLATE = TEMPLATE.replace(
    'aws_api_gateway_rest_api.{{method.serviceName}}.root_resource_id',
    'aws_api_gateway_resource.{{method.resourceName}}.id');

export class AwsApiGatewayMethod {
    template = compile(TEMPLATE);

    constructor(private config: ApiMethodConfiguration) { }

    toTerraformString(): string {
        const methodConfig = mapValues(this.config, this.configValueMapper);

        if (methodConfig.resourceName && methodConfig.resourceName.length) {
            this.template = compile(RESOURCE_TEMPLATE);
        }

        return this.template({
            method: methodConfig
        });
    }

    private configValueMapper(value: any, key: string): any {
        switch (key) {
            case 'httpVerb':
                return HttpVerbs[value];
            case 'authorizationType':
                return AuthorizationTypes[value];
            default:
                return value;
        }
    }
}

export interface ApiMethodConfiguration {
    name: string;
    serviceName: string;
    resourceName?: string;
    httpVerb: HttpVerbs;
    authorizationType: AuthorizationTypes;
}
