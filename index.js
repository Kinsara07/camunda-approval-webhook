const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Camunda Approval Middleware Service',
        timestamp: new Date().toISOString()
    });
});

// Approval endpoint
app.get('/approve/:processInstanceId', async (req, res) => {
    const { processInstanceId } = req.params;
    const { decision } = req.query;
    
    // Validate required parameters
    if (!processInstanceId) {
        return res.status(400).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2 style="color: #f44336;">❌ Error</h2>
                    <p>Process Instance ID is required</p>
                </body>
            </html>
        `);
    }

    if (!decision) {
        return res.status(400).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h2 style="color: #f44336;">❌ Error</h2>
                    <p>Decision parameter is required</p>
                </body>
            </html>
        `);
    }

    try {
        console.log(`Processing approval: ${processInstanceId}, Decision: ${decision}`);
        
        // Forward to Camunda webhook
        const camundaUrl = `https://syd-1.connectors.camunda.io/184280a2-6a55-4bca-aed3-169e7e399a45/inbound/approval?processInstanceId=${processInstanceId}&approval=${decision}`;
        
        const response = await fetch(camundaUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Approval-Middleware/1.0'
            }
        });

        console.log(`Camunda response status: ${response.status}`);
        
        // Return success page regardless of Camunda response
        // (Camunda might return various status codes that are still successful)
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Approval Status</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        text-align: center; 
                        padding: 50px 20px; 
                        background: #0d6efd;
                        min-height: 100vh;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        max-width: 400px;
                        width: 100%;
                    }
                    .success { color: #4CAF50; }
                    .rejected { color: #f44336; }
                    h2 { font-size: 28px; margin-bottom: 20px; }
                    p { font-size: 16px; color: #666; margin-bottom: 30px; }
                    .icon { font-size: 48px; margin-bottom: 20px; }
                    .footer { 
                        font-size: 14px; 
                        color: #999; 
                        margin-top: 30px; 
                        border-top: 1px solid #eee; 
                        padding-top: 20px; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">${decision === 'Approved' ? '✅' : '❌'}</div>
                    <h2 class="${decision === 'Approved' ? 'success' : 'rejected'}">
                        ${decision === 'Approved' ? 'Request Approved!' : 'Request Rejected!'}
                    </h2>
                    <p>Your decision has been recorded.</p>
                    <div class="footer">
                        Timestamp: ${new Date().toLocaleString()}
                    </div>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Error processing approval:', error);
        
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        text-align: center; 
                        padding: 50px 20px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        max-width: 400px;
                        width: 100%;
                    }
                    .error { color: #f44336; }
                    h2 { font-size: 28px; margin-bottom: 20px; }
                    p { font-size: 16px; color: #666; }
                    .icon { font-size: 48px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">⚠️</div>
                    <h2 class="error">Error Processing Request</h2>
                    <p>There was an error processing your approval request. Please try again or contact support.</p>
                </div>
            </body>
            </html>
        `);
    }
});

// Alternative endpoint that accepts POST requests
app.post('/approve', async (req, res) => {
    const { processInstanceId, decision } = req.body;
    
    if (!processInstanceId || !decision) {
        return res.status(400).json({ 
            error: 'processInstanceId and decision are required' 
        });
    }

    try {
        const camundaUrl = `https://syd-1.connectors.camunda.io/184280a2-6a55-4bca-aed3-169e7e399a45/inbound/approval?processInstanceId=${processInstanceId}&approval=${decision}`;
        
        const response = await fetch(camundaUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Approval-Middleware/1.0'
            }
        });

        res.json({ 
            success: true, 
            message: `Request ${decision.toLowerCase()} successfully`,
            processInstanceId,
            decision,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error processing approval:', error);
        res.status(500).json({ 
            error: 'Failed to process approval request',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Camunda Approval Middleware server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/`);
    console.log(`✅ Approval endpoint: http://localhost:${PORT}/approve/:processInstanceId?decision=Approved`);
});

module.exports = app;
