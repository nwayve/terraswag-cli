export interface SwaggerDocument {
    swagger: string;
    info: InfoObject;
    paths: PathsObject;
}

export interface InfoObject {
    title: string;
    version: string;
}

export interface PathsObject {
    [key: string]: any;
}
