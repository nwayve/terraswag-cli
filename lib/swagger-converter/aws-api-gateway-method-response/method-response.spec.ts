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
    AwsApiGatewayMethodResponse,
    MethodResponseConfiguration
} from '../aws-api-gateway-method-response';

describe('AwsApiGatewayMethodResponse', function () {
    let sandbox: SinonSandbox;
    let methodResponse: AwsApiGatewayMethodResponse;
    let config: MethodResponseConfiguration;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    describe('toTerraformString', function () {
        it('should create a terraform method reponse template for a root resource', function() {
            // Arrange
            config = {
                name: 'get_root',
                serviceName: 'test-service',
                statusCode: '200'
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_method_response" "get_root_200" {
                  rest_api_id = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id = "\${aws_api_gateway_rest_api.test-service.root_resource_id}"
                  http_method = "\${aws_api_gateway_method.get_root.http_method}"
                  status_code = "200"
                }\n`.replace(/\\\$/g, '$');

            // Act
            methodResponse = new AwsApiGatewayMethodResponse(config);
            const templateString = methodResponse.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });

        it('should create a terraform method response template for a child resource', function () {
            // arrange
            config = {
                name: 'get_foos',
                serviceName: 'test-service',
                resourceName: 'foos',
                statusCode: '200'
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_method_response" "get_foos_200" {
                  rest_api_id = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id = "\${aws_api_gateway_resource.foos.id}"
                  http_method = "\${aws_api_gateway_method.get_foos.http_method}"
                  status_code = "200"
                }\n`.replace(/\\\$/g, '$');

            // act
            methodResponse = new AwsApiGatewayMethodResponse(config);
            const templateString = methodResponse.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });
    });
});
