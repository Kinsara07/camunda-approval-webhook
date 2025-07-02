const { ZBClient } = require('zeebe-node');
require('dotenv').config();

(async () => {
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
      correlationKey: '0197ca19-d1cb-71c4-bf59-a58e7a636687', // Use a dummy key to test connection
      variables: { test: true },
      timeToLive: 60000,
    });

    console.log('✅ Message published successfully');
    await zbc.close();
  } catch (error) {
    console.error('❌ Connection or message publish failed:', error);
  }
})();
