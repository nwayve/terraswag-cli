variable "service_config" {
    type = "map"
    default = {}
}

provider "aws" {
    region = "us-west-2"
}

module "service_name" {
    source = "service-module"
    service = "${var.service_config}"
}
