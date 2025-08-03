resource "aws_acm_certificate" "cert" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = var.alternate_names
  validation_method         = "DNS"
  
  lifecycle {
    prevent_destroy = true  # Extra protection
  }
}

# Move the existing certificate to the new resource 
moved {
  from = aws_acm_certificate.cert[0]
  to   = aws_acm_certificate.cert
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  zone_id = aws_route53_zone.main.zone_id 
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 300
}


output "cert_arn" {

  value       = aws_acm_certificate.cert.arn
  description = "ACM certificate ARN for CloudFront"
}
