const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

app.get("/approval", async (req, res) => {
  const { processInstanceId, decision } = req.query;

  if (!processInstanceId || !decision) {
    return res.status(400).send("Missing required parameters.");
  }

  const approved = decision === "approved";

  try {
    // Camunda SaaS message correlate endpoint:
    await axios.post("https://184280a2-6a55-4bca-aed3-169e7e399a45.saas-camunda.io/api/v1/message", {
      messageName: "managerApprovalResponse",   // match your BPMN Message Catch Event
      processInstanceId,
      variables: {
        approved: { value: approved, type: "Boolean" }
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.CAMUNDA_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    res.send(`Your decision (${decision}) has been recorded, thank you!`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Could not correlate with Camunda.");
  }
});

app.listen(port, () => {
  console.log(`Approval webhook listening on port ${port}`);
});
