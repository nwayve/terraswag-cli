// vendor
import { compile } from 'handlebars';
import { mapValues } from 'lodash';

const TEMPLATE = `\
resource "aws_api_gateway_integration_response" "{{response.name}}_{{response.statusCode}}" {
  depends_on  = ["aws_api_gateway_integration.{{response.name}}"]
  rest_api_id = "\${aws_api_gateway_rest_api.{{response.serviceName}}.id}"
  resource_id = "\${aws_api_gateway_rest_api.{{response.serviceName}}.root_resource_id}"
  http_method = "\${aws_api_gateway_method.{{response.name}}.http_method}"
  status_code = "\${aws_api_gateway_method_response.{{response.name}}_{{response.statusCode}}.status_code}"
`;

const RESOURCE_TEMPLATE = TEMPLATE.replace(
    'aws_api_gateway_rest_api.{{response.serviceName}}.root_resource_id',
    'aws_api_gateway_resource.{{response.resourceName}}.id');

const SELECTION_PATTERN = `\
  selection_pattern = "{{response.selectionPattern}}"
`;

const ENDING = `\
}
`;

export class AwsApiGatewayIntegrationResponse {
    constructor(private config: IntegrationResponseConfiguration) {}

    toTerraformString(): string {
        let template = TEMPLATE;

        if (this.config.resourceName && this.config.resourceName.length) {
            template = RESOURCE_TEMPLATE;
        }

        if (this.config.selectionPattern && this.config.selectionPattern.length) {
            this.config.selectionPattern = this.config.selectionPattern.replace(/\\/g, '\\\\');
            template += SELECTION_PATTERN;
        }

        return compile(template + ENDING)({ response: this.config });
    }
}

export interface IntegrationResponseConfiguration {
    name: string;
    serviceName: string;
    statusCode: string;
    selectionPattern?: string;
    resourceName?: string;
}
