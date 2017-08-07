export class SwaggerDocument {
    swagger: string;
    info: InfoObject;
    paths: PathsObject;
}

export class InfoObject {
    title: string;
    version: string;
}

export class PathsObject {
    [key: string]: any;
}

export class ServiceConfiguration {
    name: string;
}
