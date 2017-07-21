// node
import * as fs from 'fs';
import * as path from 'path';

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
import * as del from 'del';
import * as uuid from 'uuid';

// project
import {
    swaggerToTerraform,
    SwaggerDocument
} from '../src/swagger-converter';

describe('swaggerToTerraform', function () {
    // folders
    const outDir = path.join(__dirname, 'temp');
    const testDataDir = path.join(__dirname, 'data');
    const apiModuleFolder: string = path.join(outDir, 'api-module');

    // files
    const apiTfFile = path.join(apiModuleFolder, 'api.tf');
    const mainTfFile = path.join(apiModuleFolder, 'main.tf');
    const minimalSwaggerDocJsonFile = path.join(testDataDir, 'minimal-swagger-doc.json');
    const swaggerDocJsonFile = path.join(testDataDir, 'service-swagger-doc.json');
    const testServiceSwaggerDocJsonFile = path.join(testDataDir, 'test-service-development-swagger-integrations.json');
    const uid = uuid.v4();

    let sandbox: SinonSandbox;

    let swaggerDoc: SwaggerDocument;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();

        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }

        process.chdir(outDir);

        swaggerDoc = JSON.parse(fs.readFileSync(swaggerDocJsonFile, 'utf8'));
    });

    afterEach(function () {
        process.chdir(__dirname);
        return del(outDir, { force: true });
    });

    describe('/api-module/api.tf', function () {
        it('should create an api.tf file in the /api-module folder', function () {
            // arrange

            // act
            swaggerToTerraform(swaggerDoc);

            // assert
            fs.existsSync(apiTfFile).should.be.true;
        });

        it('should overwrite the api.tf file in the /api-module folder if it already exists', function () {
            // arrange
            fs.mkdirSync(apiModuleFolder);
            fs.writeFileSync(apiTfFile, uid);

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // assert
            result.should.not.equal(uid);
        });

        it('should create minimal api.tf file from minimimal swagger document', function () {
            // arrange
            swaggerDoc = JSON.parse(fs.readFileSync(minimalSwaggerDocJsonFile, 'utf8'));
            const serviceName = swaggerDoc.info.title;
            const target = dedent
                `resource "aws_api_gateway_rest_api" "${serviceName}" {
                  name        = "\${var.service["name"]}"
                  description = "\${var.service["description"]}"
                }

                output "rest_api_id" {
                  value = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                }

                #
                # /
                #

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_root" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_root" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  http_method = "\${aws_api_gateway_method.get_root.http_method}"
                  type        = "MOCK"
                }\n`.replace(/\\\$/g, '$');

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // assert
            result.should.equal(target);
        });

        it('should handle multiple paths without creating multiple resources', function () {
            // arrange
            const serviceName = swaggerDoc.info.title;
            const target = dedent
                `resource "aws_api_gateway_rest_api" "${serviceName}" {
                  name        = "\${var.service["name"]}"
                  description = "\${var.service["description"]}"
                }

                output "rest_api_id" {
                  value = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                }

                #
                # /
                #

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_root" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_root" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  http_method = "\${aws_api_gateway_method.get_root.http_method}"
                  type        = "MOCK"
                }

                #
                # /foos
                #
                resource "aws_api_gateway_resource" "foos" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  parent_id   = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  path_part   = "foos"
                }

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_foos" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_resource.foos.id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_foos" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_resource.foos.id}"
                  http_method = "\${aws_api_gateway_method.get_foos.http_method}"
                  type        = "MOCK"
                }

                #
                # /foos/{fooId}
                #
                resource "aws_api_gateway_resource" "foos_-fooId-" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  parent_id   = "\${aws_api_gateway_resource.foos.id}"
                  path_part   = "{fooId}"
                }

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_foos_-fooId-" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_resource.foos_-fooId-.id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_foos_-fooId-" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_resource.foos_-fooId-.id}"
                  http_method = "\${aws_api_gateway_method.get_foos_-fooId-.http_method}"
                  type        = "MOCK"
                }\n`.replace(/\\\$/g, '$');

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // assert
            result.should.equal(target);
        });

        it('should handle parent path segments with not listed in the swagger paths', function () {
            // arrange
            swaggerDoc = JSON.parse(fs.readFileSync(testServiceSwaggerDocJsonFile, 'utf8'));
            const serviceName = swaggerDoc.info.title;
            const target = dedent
                `resource "aws_api_gateway_rest_api" "${serviceName}" {
                  name        = "\${var.service["name"]}"
                  description = "\${var.service["description"]}"
                }

                output "rest_api_id" {
                  value = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                }

                #
                # /
                #

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_root" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_root" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  http_method = "\${aws_api_gateway_method.get_root.http_method}"
                  type        = "MOCK"
                }

                #
                # /fizz
                #
                resource "aws_api_gateway_resource" "fizz" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  parent_id   = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  path_part   = "fizz"
                }

                #
                # /fizz/buzz
                #
                resource "aws_api_gateway_resource" "fizz_buzz" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  parent_id   = "\${aws_api_gateway_resource.fizz.id}"
                  path_part   = "buzz"
                }

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_fizz_buzz" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_resource.fizz_buzz.id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_fizz_buzz" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_resource.fizz_buzz.id}"
                  http_method = "\${aws_api_gateway_method.get_fizz_buzz.http_method}"
                  type        = "MOCK"
                }

                #
                # /foos
                #
                resource "aws_api_gateway_resource" "foos" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  parent_id   = "\${aws_api_gateway_rest_api.${serviceName}.root_resource_id}"
                  path_part   = "foos"
                }

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_foos" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_resource.foos.id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_foos" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_resource.foos.id}"
                  http_method = "\${aws_api_gateway_method.get_foos.http_method}"
                  type        = "MOCK"
                }

                #
                # /foos/{fooId}
                #
                resource "aws_api_gateway_resource" "foos_-fooId-" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  parent_id   = "\${aws_api_gateway_resource.foos.id}"
                  path_part   = "{fooId}"
                }

                #
                # GET
                #
                resource "aws_api_gateway_method" "get_foos_-fooId-" {
                  rest_api_id   = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id   = "\${aws_api_gateway_resource.foos_-fooId-.id}"
                  http_method   = "GET"
                  authorization = "NONE"
                }

                resource "aws_api_gateway_integration" "get_foos_-fooId-" {
                  rest_api_id = "\${aws_api_gateway_rest_api.${serviceName}.id}"
                  resource_id = "\${aws_api_gateway_resource.foos_-fooId-.id}"
                  http_method = "\${aws_api_gateway_method.get_foos_-fooId-.http_method}"
                  type        = "MOCK"
                }\n`.replace(/\\\$/g, '$');

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // assert
            result.should.equal(target);
        });
    });

    describe('/api-module/main.tf', function () {
        it('should create a main.tf file in the /api-module folder', function () {
            // arrange

            // act
            swaggerToTerraform(swaggerDoc);

            // assert
            fs.existsSync(mainTfFile).should.be.true;
        });

        it('should overwrite the main.tf file in the /api-module folder if it already exists', function () {
            // arrange
            fs.mkdirSync(apiModuleFolder);
            fs.writeFileSync(mainTfFile, uid);

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(mainTfFile, 'utf8');

            // assert
            result.should.not.equal(uid);
        });

        it('should create minimal main.tf file from minimimal swagger document', function () {
            // arrange
            const target = dedent
                `terraform {
                  required_version = ">= 0.9.3"
                }

                variable "service" { type = "map" }

                provider "aws" {
                  region = "\${var.service["region"]}"
                  assume_role {
                    role_arn     = "\${var.service["assumeRoleArn"]}"
                    session_name = "swagger-terraform-deployment"
                  }
                }\n`.replace(/\\\$/g, '$');

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(mainTfFile, 'utf8');

            // assert
            result.should.equal(target);
        });
    });

    describe('Validation', function () {
        it('should call the callback function with an Error if the SwaggerDocument does not have at least one path', function () {
            // arrange
            swaggerDoc.paths = {};
            const callback = sandbox.spy();

            // act
            swaggerToTerraform(swaggerDoc, callback);

            // assert
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWithMatch(null, Error);
            fs.existsSync(apiTfFile).should.be.false;
        });

        it('should call the callback function with an Error if the SwaggerDocument does not have at least one method', function () {
            // arrange
            swaggerDoc.paths = {
                '/': {}
            };
            const callback = sandbox.spy();

            // act
            swaggerToTerraform(swaggerDoc, callback);

            // assert
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWithMatch(null, Error);
            fs.existsSync(apiTfFile).should.be.false;
        });
    });
});
