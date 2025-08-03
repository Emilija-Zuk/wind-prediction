resource "aws_route53_zone" "main" {
  name = var.domain_name
}

output "route53_nameservers" {
  value       = var.stage2 ? null : aws_route53_zone.main.name_servers 
  description = "Route53 name servers"
}

resource "aws_route53_record" "alias_root" {
  count   = var.stage2 ? 1 : 0
  zone_id = local.zone_id  
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn[0].domain_name
    zone_id                = aws_cloudfront_distribution.cdn[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_www" {
  count   = var.stage2 ? 1 : 0
  zone_id = local.zone_id  
  name    = element(var.alternate_names, 0)
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn[0].domain_name
    zone_id                = aws_cloudfront_distribution.cdn[0].hosted_zone_id
    evaluate_target_health = false
  }
}
