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
    AwsApiGatewayRestApi as RestApi,
    RestApiServiceConfiguration as ServiceConfiguration
} from '../aws-api-gateway-rest-api';

describe('AwsApiGatewayRestApi', function () {
    let sandbox: SinonSandbox;
    let restApi: RestApi;
    let config: ServiceConfiguration;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    describe('toTerraformString', function () {
        it('should create a terraform rest_api template string', function () {
            // arrange
            config = {
                name: 'test-service'
            };
            const targetTerraformString = dedent
                `resource "aws_api_gateway_rest_api" "test-service" {
                  name        = "\${var.service["name"]}"
                  description = "\${var.service["description"]}"
                }

                output "rest_api_id" {
                  value = "\${aws_api_gateway_rest_api.test-service.id}"
                }\n`.replace(/\\\$/g, '$');

            // act
            restApi = new RestApi(config);
            const templateString = restApi.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });
    });
});
