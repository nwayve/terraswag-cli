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
  type        = "{{integration.type}}"`;

const LAMBDA_LINES = `
  uri         = "arn:aws:apigateway:\${var.service["region"]}:lambda:path/2015-03-31/functions/\${var.service["lambdaArn"]}/invocations"
  integration_http_method = "POST"`;

const RESOURCE_TEMPLATE = TEMPLATE.replace(
    'aws_api_gateway_rest_api.{{integration.serviceName}}.root_resource_id',
    'aws_api_gateway_resource.{{integration.resourceName}}.id');

const ENDING = `
}
`;

export class AwsApiGatewayIntegration {
    template = compile(TEMPLATE + ENDING);

    constructor(private config: IntegrationConfiguration) { }

    toTerraformString(): string {
        const integrationConfig = mapValues(this.config, this.configValueMapper);
        let template = TEMPLATE;

        if (integrationConfig.resourceName && integrationConfig.resourceName.length) {
            template = RESOURCE_TEMPLATE;
        }

        if (this.config.type === IntegrationTypes.AWS) {
            template += LAMBDA_LINES;
        }

        this.template = compile(template + ENDING);

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
