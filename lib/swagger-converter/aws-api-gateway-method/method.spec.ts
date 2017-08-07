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
    AwsApiGatewayMethod,
    ApiMethodConfiguration,
    AuthorizationTypes,
    HttpVerbs
} from '../aws-api-gateway-method';

describe('AwsApiGatewayMethod', function () {
    let sandbox: SinonSandbox;
    let method: AwsApiGatewayMethod;
    let config: ApiMethodConfiguration;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    describe('toTerraformString', function () {
        it('should create a terraform method template from a root path method', function () {
            // arrange
            config = {
                name: 'get_root',
                serviceName: 'test-service',
                httpVerb: HttpVerbs.GET,
                authorizationType: AuthorizationTypes.NONE
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_method" "get_root" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id   = "\${aws_api_gateway_rest_api.test-service.root_resource_id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }\n`.replace(/\\\$/g, '$');

            // act
            method = new AwsApiGatewayMethod(config);
            const templateString = method.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });

        it('should create a terraform method template from a terraform resource', function () {
            // arrange
            config = {
                name: 'get_foos',
                resourceName: 'foos',
                serviceName: 'test-service',
                httpVerb: HttpVerbs.GET,
                authorizationType: AuthorizationTypes.NONE
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_method" "get_foos" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id   = "\${aws_api_gateway_resource.foos.id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }\n`.replace(/\\\$/g, '$');

            // act
            method = new AwsApiGatewayMethod(config);
            const templateString = method.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });

        it('should create a terraform method template from a terraform resource with a route parameter', function () {
            // arrange
            config = {
                name: 'get_foos_-fooId-_bars',
                resourceName: 'foos_-fooId-_bars',
                serviceName: 'test-service',
                httpVerb: HttpVerbs.GET,
                authorizationType: AuthorizationTypes.NONE
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_method" "get_foos_-fooId-_bars" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.test-service.id}"
                  resource_id   = "\${aws_api_gateway_resource.foos_-fooId-_bars.id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }\n`.replace(/\\\$/g, '$');

            // act
            method = new AwsApiGatewayMethod(config);
            const templateString = method.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });
    });
});
