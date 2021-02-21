# [mmmaxwwwell/grafana-webhook-statuspageio](https://github.com/mmmaxwwwell/grafana-webhook-statuspageio)

Updates [StatusPage.io](statuspage.io) component status utilizing webhooks from [Grafana Cloud Alerting](https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/).

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mmmaxwwwell/grafana-webhook-statuspageio)

## Features:
* Utilizes [Grafana free tier](https://grafana.com/products/cloud/pricing/).
* Utilizes [StatusPage.io free tier](https://www.atlassian.com/software/statuspage).
* Runs for free on [Heroku free tier](https://www.heroku.com/free), if you add payment information.
* [Docker image on dockerhub](https://hub.docker.com/r/mmmaxwwwell/grafana-webhook-statuspageio) for self hosting.
* Uses convention based configuration stored in the [alert rule's name](https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/create-edit-rules/)


## Prerequisites:

* StatusPage.io account.
* StatusPage.io page created, including components.
* StatusPage.io API key created.
* Grafana account.
* This app deployed somewhere.

## Usage:

* In Grafana Prometheus, go to the "Cloud Alerting" > "Alertmanager" section, and paste the [Grafana Alertmanager config](#example-grafana-alertmanager-config) in. This instructs all alerts to be sent as a http post to https://wherever-you-deployed-this-repo.com.
* In Grafana Prometheus, go to the "Cloud Alerting" > "Rules" section, select your data source from the dropdown, add a new rule, and paste in the content from the [example grafana rule](#example-grafana-rule).
* On Statuspage.io, go to the edit page of the component you would like to control. the url will look like this: ```https://manage.statuspage.io/pages/your-status-page-id/components/your-component-id/edit```. Replace your-status-page-id and your-component-id values in the rule.
* In the rule, replace ```type-of-outage``` with one of the following values:
  * operational
  * degraded_performance
  * partial_outage
  * major_outage
* Set the env var STATUSPAGE_API_KEY to your Statuspage.io API key
* Set the env var STATUSPAGE_API_USERS to your replaced values in the [Grafana Alertmanager config](#example-grafana-alertmanager-config) in this format: ```arbitrary_username_here:arbitrary_password_here```


## Configs

### Example Grafana Alertmanager Config

You will need to replace ```arbitrary_username_here```, ```arbitrary_password_here``` and ```https://wherever-you-deployed-this-repo.com```
```yml
global:
  http_config:
    basic_auth:
      username: arbitrary_username_here
      password: arbitrary_password_here
route:
  receiver: default-receiver
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  group_by:
    - alertname
receivers:
  - name: default-receiver
    webhook_configs:
      - url: https://wherever-you-deployed-this-repo.com
templates: []
```

### Example Grafana Rule

This assumes you are collecting the right data to trigger this rule.
```yml
alert: your-rule-name;your-status-page-id;your-component-id;type-of-outage
expr: absent(container_start_time_seconds{name="your-container-name"})
```