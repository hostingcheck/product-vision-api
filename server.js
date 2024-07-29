require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const UserInputSchema = new mongoose.Schema({
    idea: String,
    timestamp: { type: Date, default: Date.now }
});

const DocumentSchema = new mongoose.Schema({
    userInputId: mongoose.Schema.Types.ObjectId,
    content: String,
    timestamp: { type: Date, default: Date.now }
});

const UserInput = mongoose.model('UserInput', UserInputSchema);
const RequirementsDoc = mongoose.model('RequirementsDoc', DocumentSchema);
const TechnicalAspectsDoc = mongoose.model('TechnicalAspectsDoc', DocumentSchema);
const LifecycleDoc = mongoose.model('LifecycleDoc', DocumentSchema);

async function generateDocument(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text();
}


app.post('/api/user-input', async (req, res) => {
    try {
        const userInput = new UserInput({ idea: req.body.idea });
        await userInput.save();
        res.status(201).json({ message: 'User input saved', id: userInput._id });
    } catch (error) {
        res.status(500).json({ error: 'Error saving user input' });
    }
});

app.get('/api/generate-requirements/:id', async (req, res) => {
    try {
        const userInput = await UserInput.findById(req.params.id);
        if (!userInput) {
            return res.status(404).json({ error: 'User input not found' });
        }

        const prompt = `Given the following user idea: ${userInput.idea}

Generate a comprehensive requirements document that includes:
1. Project Overview
   - Provide a concise summary of the project
   - Outline the main goals and objectives
   - Identify the target audience or users
2. Functional Requirements
   - List all core features and functionalities
   - Describe user interactions and system behaviors
   - Specify input and output requirements
3. Non-Functional Requirements
   - Define performance expectations (e.g., speed, capacity)
   - Outline security and privacy requirements
   - Specify compatibility and integration needs
4. User Stories
   - Create detailed user stories for each main feature
   - Include acceptance criteria for each story
5. Constraints and Limitations
   - Identify any technical, budget, or time constraints
   - List any known limitations of the proposed solution

Ensure the document is well-structured, detailed, and written in a clear, professional tone. Use bullet points and numbering for better readability.`;

        const content = await generateDocument(prompt);
        const requirementsDoc = new RequirementsDoc({ userInputId: userInput._id, content });
        await requirementsDoc.save();

        res.json({ document: content });
    } catch (error) {
        res.status(500).json({ error: 'Error generating requirements document' });
    }
});

app.get('/api/generate-technical/:id', async (req, res) => {
    try {
        const userInput = await UserInput.findById(req.params.id);
        if (!userInput) {
            return res.status(404).json({ error: 'User input not found' });
        }

        const prompt = `Based on this user idea: ${userInput.idea}

Create a detailed technical specification document covering:
1. System Architecture
   - Describe the overall system structure
   - Identify main components and their interactions
   - Include a high-level architecture diagram
2. Technologies and Frameworks
   - List all proposed technologies, languages, and frameworks
   - Justify the choice of each technology
   - Specify versions and any specific libraries or tools
3. Data Model
   - Design the database schema
   - Describe data entities and their relationships
   - Specify data types and constraints
4. API Endpoints
   - List all API endpoints with their purposes
   - Specify request/response formats for each endpoint
   - Include authentication and authorization details
5. Security Considerations
   - Outline data encryption methods
   - Describe user authentication and authorization processes
   - Identify potential security risks and mitigation strategies
6. Performance Requirements
   - Specify expected response times
   - Describe scalability considerations
   - Outline caching strategies if applicable
7. Integration Points
   - Identify all external systems or services to integrate with
   - Describe the integration methods (e.g., APIs, webhooks)
   - Specify any data transformation requirements

Provide in-depth explanations for each section, using technical language appropriate for a development team. Include diagrams or code snippets where they would enhance understanding.`;

        const content = await generateDocument(prompt);
        const technicalDoc = new TechnicalAspectsDoc({ userInputId: userInput._id, content });
        await technicalDoc.save();

        res.json({ document: content });
    } catch (error) {
        res.status(500).json({ error: 'Error generating technical aspects document' });
    }
});

app.get('/api/generate-lifecycle/:id', async (req, res) => {
    try {
        const userInput = await UserInput.findById(req.params.id);
        if (!userInput) {
            return res.status(404).json({ error: 'User input not found' });
        }

        const prompt = `For the following product idea: ${userInput.idea}

Generate a comprehensive product lifecycle document including:
1. Conceptualization and Planning
   - Describe the initial ideation process
   - Outline market research and competitor analysis
   - Detail the product vision and strategy
2. Design and Development
   - Break down the design phase (UX/UI design principles)
   - Outline the development methodology (e.g., Agile, Waterfall)
   - Describe prototyping and iterative development processes
3. Testing and Quality Assurance
   - Detail different types of testing (unit, integration, user acceptance)
   - Describe the QA process and tools
   - Outline the bug tracking and resolution process
4. Deployment and Launch
   - Describe the deployment strategy (e.g., phased rollout)
   - Outline marketing and user acquisition strategies
   - Detail the launch plan and post-launch monitoring
5. Maintenance and Updates
   - Describe the process for gathering user feedback
   - Outline the strategy for regular updates and feature additions
   - Detail the approach to technical debt management
6. End-of-Life Considerations
   - Describe the criteria for determining end-of-life
   - Outline the process for sunsetting the product
   - Detail data archiving or migration strategies

Offer insights into each stage of the product's lifecycle, including best practices, potential challenges, and strategies for success. Use real-world examples or case studies where appropriate to illustrate key points.`;

        const content = await generateDocument(prompt);
        const lifecycleDoc = new LifecycleDoc({ userInputId: userInput._id, content });
        await lifecycleDoc.save();

        res.json({ document: content });
    } catch (error) {
        res.status(500).json({ error: 'Error generating product lifecycle document' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));