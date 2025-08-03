resource "aws_s3_bucket" "site" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "block_all_public" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  count   = var.stage2 ? 1 : 0
  bucket = aws_s3_bucket.site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = {
        AWS = aws_cloudfront_origin_access_identity.oai[0].iam_arn
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.site.arn}/*"
    }]
  })
}
