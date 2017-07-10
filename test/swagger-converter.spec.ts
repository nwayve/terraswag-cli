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
    const serviceModuleFolder: string = path.join(outDir, 'service-module');

    // files
    const apiTfFile = path.join(serviceModuleFolder, 'api.tf');
    const mainTfFile = path.join(serviceModuleFolder, 'main.tf');
    const minimalSwaggerDocJsonFile = path.join(testDataDir, 'minimal-swagger-doc.json');
    const uid = uuid.v4();

    let sandbox: SinonSandbox;

    let swaggerDoc: SwaggerDocument;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();

        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }

        process.chdir(outDir);

        swaggerDoc = JSON.parse(fs.readFileSync(minimalSwaggerDocJsonFile, 'utf8'));
    });

    afterEach(function () {
        process.chdir(__dirname);
        return del(outDir, { force: true });
    });

    describe('/service-module/api.tf', function () {
        it('should create an api.tf file in the /service-module folder', function () {
            // arrange

            // act
            swaggerToTerraform(swaggerDoc);

            // assert
            fs.existsSync(apiTfFile).should.be.true;
        });

        it('should overwrite the api.tf file in the /service-module folder if it already exists', function () {
            // arrange
            fs.mkdirSync(serviceModuleFolder);
            fs.writeFileSync(apiTfFile, uid);

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // assert
            result.should.not.equal(uid);
        });

        it('should create minimal api.tf file from minimimal swagger document', function () {
            // arrange
            const target =
                `resource "aws_api_gateway_rest_api" "${swaggerDoc.info.title}" {\n` +
                `  name        = "\${var.service["name"]}"\n` +
                `  description = "\${var.service["description"]}"\n` +
                `}\n`;

            // act
            swaggerToTerraform(swaggerDoc);
            const result = fs.readFileSync(apiTfFile, 'utf8');

            // assert
            result.should.equal(target);
        });
    });

    describe('/service-module/main.tf', function () {
        it('should create a main.tf file in the /service-module folder', function () {
            // arrange

            // act
            swaggerToTerraform(swaggerDoc);

            // assert
            fs.existsSync(mainTfFile).should.be.true;
        });

        it('should overwrite the main.tf file in the /service-module folder if it already exists', function () {
            // arrange
            fs.mkdirSync(serviceModuleFolder);
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
