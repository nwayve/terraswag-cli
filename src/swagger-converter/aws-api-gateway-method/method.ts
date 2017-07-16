// Vendor
import { compile } from 'handlebars';
import { mapValues } from 'lodash';

// Project
import { ApiMethodConfiguration, HttpVerbs, AuthorizationTypes } from './index';

const TEMPLATE =
`resource "aws_api_gateway_method" "{{method.name}}" {
  rest_api_id   = "\${aws_api_gateway_rest_api.{{method.serviceName}}.id}"
  resource_id   = "\${aws_api_gateway_rest_api.{{method.serviceName}}.root_resource_id}"
  http_method   = "{{method.httpVerb}}"
  authorization = "{{method.authorizationType}}"
}
`;
export class AwsApiGatewayMethod {
    template = compile(TEMPLATE);

    constructor(private config: ApiMethodConfiguration) { }

    toTerraformString(): string {
        return this.template({
            method: mapValues(this.config, this.configValueMapper)
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
