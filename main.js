const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const basicAuth = require('express-basic-auth')
const request = require('request');
const https = require('https');

app.use(bodyParser.json())

{
  let users = {}
  process.env.STATUSPAGE_API_USERS.split(',').forEach((value) => {
    const [username, password] = value.split(":")
    users[username] = password
  })
  app.use(basicAuth({ users }))
}

app.get("/", (req, res) => {
  res.send("OK")
})

app.post('/', async (req, res) => {
  console.log(req.body)
  // console.log("handling alert")
  if (req.body && req.body.alerts) {
    handleAlerts(req.body.alerts)
  }
  res.send("OK")
})

const getMaintenances = (pageId) => new Promise( async (resolve, reject) => {
  const options = {
    hostname: 'api.statuspage.io',
    port: 443,
    path: `/v1/pages/${pageId}/incidents/active_maintenance.json`,
    method: 'GET',
    headers: {
      Authorization: `OAuth ${process.env.STATUSPAGE_API_KEY}`
    }
  };

  let req = https.request(options, (response) => {
    let datas = []

    response.on('data', (part) => {
      datas.push(part)
    })

    response.on('end', () => {
      let data = JSON.parse(Buffer.concat(datas).toString())
      resolve(data)
    })

    response.on('error', (error) => {
      console.error(error)
      resolve([])
    })
  })
  req.end()
})

const handleAlerts = async (alerts) => {
  let maintenances = {}
  alerts.forEach(async (alert, index) => {
    let [rulename, pageId, componentId, outageType] = alert.labels.alertname.split(';')
    //valid statuses are:
    //operational
    //under_maintenance
    //degraded_performance
    //partial_outage
    //major_outage
    let status = alert.status == 'resolved' ? 'operational' : outageType
    console.log({ rulename, pageId, componentId, outageType, alertStatus: alert.status, status })

    let underMaintenance = false
    //check if we're in a maintenance for this period
    if (status != 'operational') {
      //if this is the first request in the batch, cache the result of maintenances to avoid extra api calls
      if (maintenances[pageId] === undefined) {
        console.log(`fetching status of pageId ${pageId}`)
        maintenances[pageId] = await getMaintenances(pageId)
      }

      try{
        if (maintenances[pageId] instanceof Array)
        {
          maintenances[pageId].forEach((maintenance) => {
            maintenance.components.forEach((component) => {
              if(component.id == componentId)
              underMaintenance = true
            })
          })
        }
      }catch(ex){
        console.error(ex)
      }
    }

    if(alert.status != 'resolved' && underMaintenance)
      status = 'under_maintenance'
    request.patch(
      {
        headers: {
          Authorization: 'OAuth ' + process.env.STATUSPAGE_API_KEY
        },
        url: `https://api.statuspage.io/v1/pages/${pageId}/components/${componentId}.json`,
        body: JSON.stringify({ component: { status } }),
        method: 'PATCH'
      }
    )
  })
}

const server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`started on port ${process.env.PORT || 3000}`)
})
