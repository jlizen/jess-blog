+++
title = "Protect against bots with AWS WAF Challenge and CAPTCHA actions"
description = "AWS WAF uses CAPTCHA and Challenge actions to undertake a client-side interaction."
date = 2024-07-15

[taxonomies]
tags = ["aws-waf", "security"]

[extra]
comments = false
+++

*Originally published on the [AWS Networking & Content Delivery Blog](https://aws.amazon.com/blogs/networking-and-content-delivery/protect-against-bots-with-aws-waf-challenge-and-captcha-actions/), co-authored with David MacDonald.*

> Protecting against bot threats requires insights into the client environment beyond what is available through network-level characteristics of a request, such as TCP or HTTP payload signatures. AWS WAF uses CAPTCHA and Challenge actions to undertake a client-side interaction, whether on a mobile device or browser, to understand this client environment before they can be allowed by AWS WAF.

![Sequence diagram of the AWS WAF interstitial Challenge interaction between a user, their browser, and a protected resource](https://d2908q01vomqb2.cloudfront.net/5b384ce32d8cdef02bc3a139d4cac0a22bb029e8/2025/11/04/Picture-1-3.png)

*AWS WAF interstitial Challenge flow.*

[Read the full article on the AWS Blog.](https://aws.amazon.com/blogs/networking-and-content-delivery/protect-against-bots-with-aws-waf-challenge-and-captcha-actions/)
