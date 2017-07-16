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
// import * as del from 'del';

// project
import {
    AwsApiGatewayRestApi as RestApi,
    RestApiServiceConfiguration as ServiceConfiguration
} from './index';

describe('AwsApiGatewayRestApi', function () {
    let sandbox: SinonSandbox;
    let restApi: RestApi;
    let service: ServiceConfiguration;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    describe('toTerraformString', function () {
        it('should create a terraform template string', function () {
            // arrange
            service = {
                name: 'test-service'
            };
            const targetTerraformString = dedent
                `resource "aws_api_gateway_rest_api" "${service.name}" {
                  name        = "\${var.service["name"]}"
                  description = "\${var.service["description"]}"
                }

                output "rest_api_id" {
                  value = "\${aws_api_gateway_rest_api.${service.name}.id}"
                }\n`.replace(/\\\$/g, '$');

            // act
            restApi = new RestApi(service);
            const templateString = restApi.toTerraformString();

            // assert
            templateString.should.equal(targetTerraformString);
        });
    });
});
