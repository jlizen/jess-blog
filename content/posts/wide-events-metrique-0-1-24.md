+++
title = "Wide events and metrique 0.1.24"
description = "We now have a turnkey integration with tokio-metrics (which I also maintain), that allows automatically emitting tokio runtime metrics as metrique records."
# Original LinkedIn activity timestamp, in UTC.
date = 2026-04-14

[taxonomies]
tags = ["rust", "observability", "tokio"]

[extra]
comments = false
+++

*This was pulled from my old [LinkedIn](https://www.linkedin.com/posts/jess-izen-12085b161_release-metrique-v0124-awslabsmetrique-activity-7449895340465393664-kyQk).*

There's been a lot of interest in flight recording lately, such as [Russell Cohen](https://www.linkedin.com/in/russell-cohen-b75b9927/) and my [dial9 tokio flight recorder](https://github.com/dial9-rs/dial9).

But, metrics are still very useful! After all, you need a metric to go red or a dashboard to look weird, in order to know to analyze traces in the first place. In particular, I prefer wide events, which lets you emit simple metrics, but also preserve high-cardinality metadata for drill downs or aggregating for trends. The workflow I use is, metric to alert/dashboard, wide event queries to contextualize, trace to deep dive.

In support of this, I maintain a wide-events-as-metrics library, [metrique](https://github.com/awslabs/metrique), which is the main Rust metrics library used inside Amazon. The TLDR is that it lets you use macros to tag structs with metrics, which do the "right thing" on drop, very cheaply, with embedded measurements and metadata. Its API is very async-friendly: you can fan out to child tasks that fold data back into your main emission, and delay flushing (but not foreground flow) until all segments finish. Currently EMF, JSON, and custom formats are supported, OTLP coming soon.

Our latest release, [0.1.24](https://github.com/awslabs/metrique/releases/tag/metrique-v0.1.24), brings a few nice features:

We now have a turnkey integration with [tokio-metrics](https://github.com/tokio-rs/tokio-metrics) (which I also maintain), that allows automatically emitting tokio runtime metrics as metrique records. We already had a similar integration for [metrics.rs](https://metrics.rs/) aggregated metrics. But, with metrique, we are setting ourselves up to fold "what was the state of the tokio runtime during this request" into wide event records, which is neat. Kudos to [Julian Montes de Oca](https://www.linkedin.com/in/joulei/) for this feature.

Second, we now support emitting "properties" (metadata strings) as `["arrays", "of", ["possibly", "nested"], "strings"]`. AWS Cloudwatch Log Insights and most other backends gracefully handles complex properties in EMF (or JSON) records, but AFAIK, few off the shelf EMF libraries do. I've frequently found myself manually casting properties to `"list,of,values"`, so this should be a nice paper cut fix.

Finally, I added support for `Counter::increment_owned`, which adds tokio friendly bounds to its guard. It lets you bump up a global counter that captures eg current requests in flight for one wide event, and decrement the counter after the request ends.

We will be tabling at [TokioConf](https://www.tokioconf.com/2026) next week, come find us!
