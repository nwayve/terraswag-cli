variable "service" { type = "map" }

provider "aws" {
  region = "${var.service["region"]}"
}
