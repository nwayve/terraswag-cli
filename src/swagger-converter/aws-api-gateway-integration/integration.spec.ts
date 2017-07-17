// testing
import * as chai from 'chai';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
chai.should();
chai.use(sinonChai);

// vendor
import * as dedent from 'dedent';

// project
import {
    AwsApiGatewayIntegration,
    IntegrationConfiguration,
    IntegrationTypes
} from '../aws-api-gateway-integration';

describe('AwsApiGatewayIntegration', function () {
    let sandbox: SinonSandbox;
    let integration: AwsApiGatewayIntegration;
    let config: IntegrationConfiguration;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    describe('toTerraformString', function () {
        it('should create a terraform integration template on a root resource with bare minimum requirements', function () {
            // arrange
            config = {
                name: 'get_root',
                serviceName: 'test-service',
                type: IntegrationTypes.MOCK
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_integration" "get_root" {
                  rest_api_id = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id = "\${aws_api_gateway_rest_api.test-service.root_resource_id}"
                  http_method = "\${aws_api_gateway_method.get_root.http_method}"
                  type        = "MOCK"
                }\n`.replace(/\\\$/g, '$');

            // act
            integration = new AwsApiGatewayIntegration(config);
            const templateString = integration.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });

        it('should create a terraform integration template on a parent resource with bare minimum requirements', function () {
            // arrange
            config = {
                name: 'get_foos',
                serviceName: 'test-service',
                resourceName: 'foos',
                type: IntegrationTypes.MOCK
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_integration" "get_foos" {
                  rest_api_id = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id = "\${aws_api_gateway_resource.foos.id}"
                  http_method = "\${aws_api_gateway_method.get_foos.http_method}"
                  type        = "MOCK"
                }\n`.replace(/\\\$/g, '$');

            // act
            integration = new AwsApiGatewayIntegration(config);
            const templateString = integration.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });

        it('should create a terraform integration template on a parent resource configured for AWS Lambda', function () {
            // arrange
            config = {
                name: 'get_foos',
                serviceName: 'test-service',
                resourceName: 'foos',
                type: IntegrationTypes.AWS
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_integration" "get_foos" {
                  rest_api_id = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id = "\${aws_api_gateway_resource.foos.id}"
                  http_method = "\${aws_api_gateway_method.get_foos.http_method}"
                  type        = "AWS"
                  uri         = "arn:aws:apigateway:\${var.service["region"]}:lambda:path/2015-03-31/functions/\${var.service["lambdaArn"]}/invocations"
                  integration_http_method = "POST"
                }\n`.replace(/\\\$/g, '$');

            // act
            integration = new AwsApiGatewayIntegration(config);
            const templateString = integration.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });
    });
});
