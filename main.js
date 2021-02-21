const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const basicAuth = require('express-basic-auth')
var request = require('request');

app.use(bodyParser.json())

{
  let users = {}
  process.env.STATUSPAGE_API_USERS.split(',').forEach((value) => {
    const [username, password] = value.split(":")
    users[username] = password
  })
  app.use(basicAuth({users}))
}

app.get("/", (req, res) => {
  res.send("OK")
})

app.post('/', async (req, res) => {
  // console.log("handling alert")
  if(req.body && req.body.alerts){
    handleAlerts(req.body.alerts)
  }
  res.send("OK")
})

const handleAlerts = async (alerts) => {
  // console.log(`alerts length: ${alerts.length}`)
  alerts.forEach((alert, index) => {
    // console.log(`alert ${index}`,{alert})
    let [rulename,pageId,componentId,outageType] = alert.labels.alertname.split(';')
    //valid statuses are:
    //operational
    //degraded_performance
    //partial_outage
    //major_outage
    let status = alert.status == 'resolved' ? 'operational' : outageType
    console.log({rulename,pageId,componentId,outageType, alertStatus: alert.status, status})
    request.patch(
      { 
        headers: {
          Authorization: 'OAuth ' + process.env.STATUSPAGE_API_KEY
        },
        url: `https://api.statuspage.io/v1/pages/${pageId}/components/${componentId}.json`,
        body: JSON.stringify({component: { status }}),
        method: 'PATCH'
      }
    )
  })
}

const server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`started on port ${process.env.PORT || 3000}`)
})
