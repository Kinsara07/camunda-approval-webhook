const express = require('express');
const { ZBClient } = require('zeebe-node');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/approval', async (req, res) => {
  const { processInstanceId, decision } = req.query;

  if (!processInstanceId || !decision) {
    return res.status(400).send('Missing parameters.');
  }

  const approved = decision === 'approve';

  try {
    const zbc = new ZBClient({
      camundaCloud: {
        clientId: process.env.CAMUNDA_CLIENT_ID,
        clientSecret: process.env.CAMUNDA_CLIENT_SECRET,
        clusterId: process.env.CAMUNDA_CLUSTER_ID,
        region: process.env.CAMUNDA_REGION,
      },
      useTLS: true,
    });

    console.log('✅ Connected to Camunda Cloud');

    await zbc.publishMessage({
      name: 'managerApprovalResponse',
      correlationKey: processInstanceId,
      variables: {
        approved,
      },
      timeToLive: 60000,
    });

    console.log('✅ Message published successfully');
    await zbc.close();
    res.send('✅ Approval recorded.');
  } catch (err) {
    console.error('❌ Message publish failed:', err);
    res.status(500).send('❌ Failed to publish message.');
  }
});

app.listen(port, () => {
  console.log(`🚀 Approval webhook listening on port ${port}`);
});
