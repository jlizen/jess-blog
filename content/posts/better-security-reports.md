+++
title = "Better security reports through clearer project documentation"
description = "This matters because we need to prioritize high impact reports. Every report takes maintainer resources."
draft = true
# Awaiting the original LinkedIn URL or posting date before backdating.
# Enable these tags once dated: Apollo's tag listings require a date.
# [taxonomies]
# tags = ["rust", "security", "maintainers"]
+++

*This was pulled from my old [LinkedIn](https://lnkd.in/p/gvuSj5Kt).*

LLMs are increasingly finding reachable, unwanted states. But per [Jacob](https://alpha-omega.dev/blog/reducing-slop-llm-reports-by-documenting-your-projects-intended-use-case/):

> For better – and worse – the vast majority of reports are uninteresting, at least for Rust projects. Most can be summarized as “If you use the project in a way it wasn’t intended, then you have a bad user experience.”

Jacob is a colleague at the Rust Foundation that has been on the ground stemming the huge tide of crates.io vulnerability reports (many of which he himself discovered).

Jacob's observation is, providing certain kinds of information up front in the project will dramatically improve the quality of security findings.

This matters because we need to prioritize high impact reports. Every report takes maintainer resources. We need to keep signal high so we don't bury the cases that deserve serious maintainer attention.

Thank you to [Alpha-Omega](https://alpha-omega.dev/) for supporting Jacob's work!
