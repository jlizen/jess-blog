+++
title = "Lambda Rust Runtime 1.1.1"
description = "The headline new feature is concurrent invocation processing on a single lambda instance, using tokio."
# Original LinkedIn activity timestamp, in UTC.
date = 2026-03-13

[taxonomies]
tags = ["rust", "aws-lambda", "tokio"]
+++

*This was pulled from my old [LinkedIn](https://www.linkedin.com/posts/jess-izen-12085b161_release-v111-awsaws-lambda-rust-runtime-activity-7438296402595651584-wDwN).*

The Lambda Rust Runtime just published our first big release post-1.x.

The headline new feature is concurrent invocation processing on a single lambda instance, using tokio[^tokioconf]. We have an open issue about [adding further runtime options here](https://github.com/aws/aws-lambda-rust-runtime/issues/1120).

This was a tricky release to plan for. We knew we wanted to improve ergonomics, since we had to lock down a lot of previously wide-open types for 1.0. Over the years, we had gotten comfortable releasing a rapid-fire stream of breaking `lambda-events` versions to keep up with AWS record changes. (Sure was nice while it lasted)

The new builders for event types were a good compromise, since we had to tag our previously public event types as `#[non_exhaustive]` for 1.0. [Luciano Mammino](https://www.linkedin.com/in/lucianomammino/) added some custom builders for SQS & Kinesis to keep stream processing nice. And then, [Astraea S.](https://www.linkedin.com/in/astraeaqs/) added a generalized builder for all other events ([bon](https://bon-rs.com/) under the hood).

I also like what we did with the extension API's telemetry records. They are now optionally generic, which lets you deserialize directly into json (or a fancier type) with no intermediate parsing. This brings the ergonomics closer to managing a regular invocation event handler. (That was a slog of a PR, thanks [Raphaël Thériault](https://www.linkedin.com/in/raphaeltheriault/))

Kudos and appreciation to [Davide Melfi](https://www.linkedin.com/in/davide-melfi/) for leading the release!

[Release notes](https://github.com/aws/aws-lambda-rust-runtime/releases/tag/lambda_runtime-v1.1.1)

[^tokioconf]: Come to [TokioConf](https://www.tokioconf.com/2026) in Portland, 4/20-4/23.
