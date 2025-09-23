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

# record-wind bucket
resource "aws_s3_bucket" "record_wind" {
  bucket = "record-wind"
}

resource "aws_s3_bucket_public_access_block" "record_wind_block" {
  bucket                  = aws_s3_bucket.record_wind.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# forecast-wind bucket
resource "aws_s3_bucket" "forecast_wind" {
  bucket = "forecast-wind"
}

resource "aws_s3_bucket_public_access_block" "forecast_wind_block" {
  bucket                  = aws_s3_bucket.forecast_wind.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "current_wind" {
  bucket = "current-wind"
}

resource "aws_s3_bucket_public_access_block" "current_wind_block" {
  bucket                  = aws_s3_bucket.current_wind.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}