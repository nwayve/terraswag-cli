// vendor
import { compile } from 'handlebars';
import { mapValues } from 'lodash';

// project
import { IntegrationConfiguration, IntegrationTypes } from './index';

const TEMPLATE = `\
resource "aws_api_gateway_integration" "{{integration.name}}" {
  rest_api_id = "\${aws_api_gateway_rest_api.{{integration.serviceName}}.id}"
  resource_id = "\${aws_api_gateway_rest_api.{{integration.serviceName}}.root_resource_id}"
  http_method = "\${aws_api_gateway_method.{{integration.name}}.http_method}"
  type        = "{{integration.type}}"
}
`;

const RESOURCE_TEMPLATE = TEMPLATE.replace(
    'aws_api_gateway_rest_api.{{integration.serviceName}}.root_resource_id',
    'aws_api_gateway_resource.{{integration.resourceName}}.id');

export class AwsApiGatewayIntegration {
    template = compile(TEMPLATE);

    constructor(private config: IntegrationConfiguration) { }

    toTerraformString(): string {
        const integrationConfig = mapValues(this.config, this.configValueMapper);

        if (integrationConfig.resourceName && integrationConfig.resourceName.length) {
            this.template = compile(RESOURCE_TEMPLATE);
        }

        return this.template({ integration: integrationConfig });
    }

    private configValueMapper(value: any, key: string): any {
        switch (key) {
            case 'type':
                return IntegrationTypes[value];
            default:
                return value;
        }
    }
}
