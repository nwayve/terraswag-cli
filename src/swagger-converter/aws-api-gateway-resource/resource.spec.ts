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
    AwsApiGatewayResource,
    ResourceConfiguration
} from '../aws-api-gateway-resource';

describe('AwsApiGatewayResource', function () {
    let sandbox: SinonSandbox;
    let resource: AwsApiGatewayResource;
    let config: ResourceConfiguration;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    describe('toTerraformString', function () {
        it('should create a terraform resource template from the root as the parent', function () {
            // arrange
            config = {
                name: 'foos',
                serviceName: 'test-service',
                pathPart: 'foos'
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_resource" "foos" {
                  rest_api_id = "\${aws_api_gateway_rest_api.test-service.id}"
                  parent_id   = "\${aws_api_gateway_rest_api.test-service.root_resource_id}"
                  path_part   = "foos"
                }\n`.replace(/\\\$/g, '$');

            // act
            resource = new AwsApiGatewayResource(config);
            const templateString = resource.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });

        it('should create a terraform resource template from a resource as the parent', function () {
            // arrange
            config = {
                name: 'bars',
                serviceName: 'test-service',
                parentName: 'foos',
                pathPart: 'bars'
            };

            const targetTerraformString = dedent
                `resource "aws_api_gateway_resource" "bars" {
                  rest_api_id = "\${aws_api_gateway_rest_api.test-service.id}"
                  parent_id   = "\${aws_api_gateway_resource.foos.id}"
                  path_part   = "bars"
                }\n`.replace(/\\\$/g, '$');

            // act
            resource = new AwsApiGatewayResource(config);
            const templateString = resource.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });
    });
});
