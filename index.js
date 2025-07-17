const express = require('express');
const bodyParser = require('body-parser');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Load Dialogflow credentials
const dialogflowClient = new SessionsClient({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
});

const projectId = 'neobizworld-jtvo'; // from Dialogflow agent
const sessionId = uuid.v4();

app.post('/webhook', async (req, res) => {
    const incomingMsg = req.body.Body;
    const senderNumber = req.body.From;

    const sessionPath = dialogflowClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: incomingMsg,
                languageCode: 'en', // or 'ms' if you're using Malay
            },
        },
    };

    try {
        const responses = await dialogflowClient.detectIntent(request);
        const result = responses[0].queryResult;
        const reply = result.fulfillmentText || "Sorry, I didn't get that.";

        // Respond back to Twilio
        res.set('Content-Type', 'text/xml');
        res.send(`
      <Response>
        <Message>${reply}</Message>
      </Response>
    `);
    } catch (error) {
        console.error('Dialogflow Error:', error);
        res.send(`
      <Response>
        <Message>Something went wrong. Please try again later.</Message>
      </Response>
    `);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot server running on port ${PORT}`);
});
