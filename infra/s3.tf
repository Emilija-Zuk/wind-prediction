
resource "aws_s3_bucket" "static_website" {

  bucket = "www.wind-prediction.live"
  tags = {
    Name        = "My bucket"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket_public_access_block" "unblock" {
  bucket = aws_s3_bucket.static_website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.static_website.id
  index_document {
    suffix = "index.html"
  }

}

resource "aws_s3_bucket_policy" "static_website_policy" {
  bucket = aws_s3_bucket.static_website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "PublicReadGetObject"
        Effect = "Allow"
        Principal = "*"
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_website.arn}/*"
      }
    ]
  })

  depends_on = [
    aws_s3_bucket.static_website,
    aws_s3_bucket_public_access_block.unblock
  ]
}

resource "aws_s3_bucket_cors_configuration" "cors" {
  bucket = aws_s3_bucket.static_website.id

  cors_rule {
    allowed_methods = ["GET", "POST", "PUT"]
    allowed_origins = ["http://www.wind-prediction.live.s3-website-ap-southeast-2.amazonaws.com", "http://www.wind-prediction.live"] 
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
  }
}
