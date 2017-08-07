// vendor
import { compile } from 'handlebars';
import { mapValues } from 'lodash';

const TEMPLATE = `\
resource "aws_api_gateway_integration_response" "{{response.name}}_{{response.statusCode}}" {
  rest_api_id = "\${aws_api_gateway_rest_api.{{response.serviceName}}.id}"
  resource_id = "\${aws_api_gateway_rest_api.{{response.serviceName}}.root_resource_id}"
  http_method = "\${aws_api_gateway_method.{{response.name}}.http_method}"
  status_code = "{{response.statusCode}}"
}
`;

const RESOURCE_TEMPLATE = TEMPLATE.replace(
    'aws_api_gateway_rest_api.{{response.serviceName}}.root_resource_id',
    'aws_api_gateway_resource.{{response.resourceName}}.id');

export class AwsApiGatewayIntegrationResponse {
    template = compile(TEMPLATE);

    constructor(private config: IntegrationResponseConfiguration) {}

    toTerraformString(): string {
        let template = this.template;

        if (this.config.resourceName && this.config.resourceName.length) {
            template = compile(RESOURCE_TEMPLATE);
        }

        return template({ response: this.config });
    }
}

export interface IntegrationResponseConfiguration {
    name: string;
    serviceName: string;
    statusCode: string;
    resourceName?: string;
}
