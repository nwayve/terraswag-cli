// vendor
import { compile } from 'handlebars';
import { mapValues } from 'lodash';

// project
import { ApiMethodConfiguration, HttpVerbs, AuthorizationTypes } from './index';

// *Note: The 'resource_id' property is intentionally missing a trailing '}'
//          handlebars can't deal with trailing '}}}', so induded it in 'identifier' value.
const TEMPLATE = `\
resource "aws_api_gateway_method" "{{method.name}}" {
  rest_api_id   = "\${aws_api_gateway_rest_api.{{method.serviceName}}.id}"
  resource_id   = "\${aws_api_gateway_{{resource.type}}.{{resource.name}}.{{resource.identifier}}"
  http_method   = "{{method.httpVerb}}"
  authorization = "{{method.authorizationType}}"
}
`;
export class AwsApiGatewayMethod {
    template = compile(TEMPLATE);
    resourceConfig: object;

    constructor(private config: ApiMethodConfiguration) {
        this.resourceConfig = {
            type: 'rest_api',
            name: config.serviceName,
            identifier: 'root_resource_id}'
        };
    }

    toTerraformString(): string {
        const methodConfig = mapValues(this.config, this.configValueMapper);

        if (methodConfig.resourceName && methodConfig.resourceName.length) {
            this.resourceConfig = {
                type: 'resource',
                name: methodConfig.resourceName,
                identifier: 'id}'
            };
        }

        return this.template({
            method: methodConfig,
            resource: this.resourceConfig
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
