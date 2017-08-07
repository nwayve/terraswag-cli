import { SwaggerDocument } from '../../lib/swagger-converter';

export const serviceSwaggerDoc: SwaggerDocument = require('./service-swagger-doc.json');
export const advancedSwaggerDoc: SwaggerDocument = require('./test-service-development-swagger-integrations.json');

export const lambdaIntegrationSwaggerDoc: SwaggerDocument = require('./lambda-integration.swagger.json');
export const minimalSwaggerDoc: SwaggerDocument = require('./minimal.swagger.json');
export const parentPathNoMethodSwaggerDoc: SwaggerDocument = require('./parent-path-no-method.swagger.json');
export const repeatResourceNoDuplicatesSwaggerDoc: SwaggerDocument = require('./repeat-resource-no-duplicates.swagger.json');
