variable "domain_name" {
  type = string
  default = "wind-prediction.live"
}

variable "bucket_name" {
  type    = string
  default = "wind-prediction"
}

variable "alternate_names" {
  type    = list(string)
  default = ["www.wind-prediction.live"]
}

variable "stage2" {
  type    = bool
  default = true  # true for stage 2, false for stage 1
}

data "aws_route53_zone" "existing" {
  count        = var.stage2 ? 1 : 0
  name         = "${var.domain_name}."
  private_zone = false 
}

data "aws_acm_certificate" "existing" {
  count       = var.stage2 ? 1 : 0
  domain      = var.domain_name
  statuses    = ["ISSUED"]
  provider    = aws.us_east_1
  most_recent = true
}

locals {
  cert_arn = aws_acm_certificate.cert.arn 
  zone_id = aws_route53_zone.main.zone_id 
}

variable "REGION" {
  default = "ap-southeast-2"
}

variable "ZONE1" {
  default = "ap-southeast-2a"
}

#  AWS account details
data "aws_caller_identity" "current" {}