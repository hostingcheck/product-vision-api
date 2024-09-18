require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const mongoURI = process.env.MONGODB_URI;
const updatedURI = mongoURI.replace('mongodb://', 'mongodb+srv://').split(',')[0];

mongoose.connect(updatedURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const UserInputSchema = new mongoose.Schema({
    idea: String,
    domain: String,
    timestamp: { type: Date, default: Date.now }
});

const DocumentSchema = new mongoose.Schema({
    userInputId: mongoose.Schema.Types.ObjectId,
    content: String,
    domain: String,
    type: String,
    timestamp: { type: Date, default: Date.now }
});

const UserInput = mongoose.model('UserInput', UserInputSchema);
const GeneratedDocument = mongoose.model('GeneratedDocument', DocumentSchema);

async function generateDocument(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

const domainSpecificPrompts = {
    requirements: {
        "Software Technology": `Generate a comprehensive software requirements document for a Software Technology project based on this idea: [USER_IDEA]

Include:
1. Project Overview: Provide a detailed summary of the software project, its main objectives, and the problem it aims to solve.
2. Functional Requirements: List all core features and functionalities, describing user interactions and system behaviors in detail.
3. Non-Functional Requirements: Define performance expectations, security measures, scalability needs, and any other quality attributes.
4. User Stories: Create detailed user stories for each main feature, including acceptance criteria.
5. Technical Constraints: Outline any limitations or constraints related to technology, platforms, or development environment.
6. Integration Requirements: Specify any necessary integrations with external systems, APIs, or services.
7. Security and Compliance Needs: Detail the security features required and any industry-specific compliance standards to be met.
8. User Interface Requirements: Describe the general layout, responsiveness, and accessibility requirements for the user interface.
9. Data Requirements: Specify the types of data the system will handle, storage needs, and any data processing requirements.
10. System Architecture Overview: Provide a high-level description of the proposed system architecture.

Ensure the document is well-structured, detailed, and written in a clear, professional tone. Use bullet points and numbering for better readability.`,

        "Healthcare and Biotech": `Create a detailed requirements document for a Healthcare and Biotech solution based on this idea: [USER_IDEA]

Include:
1. Project Overview and Medical Context: Provide a comprehensive summary of the healthcare/biotech project, its objectives, and the specific medical or biological problem it addresses.
2. Functional Requirements: Detail the core functionalities, including both clinical and administrative features. Describe how the solution interacts with users (patients, healthcare providers, researchers) and processes biological data or medical information.
3. Regulatory Compliance Requirements: Outline all relevant healthcare regulations (e.g., HIPAA, GDPR, FDA requirements) that the solution must comply with.
4. Data Privacy and Security Needs: Specify robust data protection measures, access control systems, and encryption requirements to safeguard sensitive medical information.
5. Integration with Existing Health Systems: Describe how the solution will integrate with Electronic Health Records (EHR), Laboratory Information Management Systems (LIMS), or other relevant healthcare IT infrastructure.
6. User Roles and Workflows: Define the different user roles (e.g., doctors, nurses, lab technicians, patients) and their specific workflows within the system.
7. Performance and Scalability Requirements: Specify the system's performance needs, including response times, data processing capabilities, and scalability to handle increasing volumes of medical data or user load.
8. Biotech-Specific Requirements: If applicable, include requirements for handling biological data, genomic information, or specific laboratory processes.
9. Reporting and Analytics: Outline the types of medical or research reports the system should generate and any analytical capabilities required.
10. Ethical Considerations: Address any ethical implications of the project, especially regarding patient data use, consent management, and research integrity.

Ensure the document is comprehensive, clearly structured, and adheres to healthcare industry standards. Use medical terminology where appropriate and provide clear explanations for technical concepts.`,

        "Renewable Energy": `Develop a comprehensive requirements document for a Renewable Energy project based on this idea: [USER_IDEA]

Include:
1. Project Overview and Energy Context: Provide a detailed summary of the renewable energy project, its objectives, and its potential impact on the energy sector.
2. Technical Specifications and Performance Requirements: Detail the energy generation capacity, efficiency expectations, and technical specifications of the renewable energy system.
3. Environmental Impact Considerations: Outline the environmental benefits of the project and any measures to mitigate potential negative impacts.
4. Regulatory Compliance Needs: List all relevant energy sector regulations and environmental standards that the project must adhere to.
5. Integration with Existing Power Infrastructure: Describe how the renewable energy system will integrate with the existing power grid or energy distribution systems.
6. Monitoring and Control Systems Requirements: Specify the requirements for real-time monitoring, data collection, and control systems for the energy production and distribution.
7. Safety and Reliability Standards: Detail the safety features required and reliability standards to be met, including fail-safe mechanisms and emergency protocols.
8. Energy Storage Solutions: If applicable, include requirements for energy storage systems to manage intermittent energy production.
9. Scalability and Modularity: Describe how the system can be scaled or expanded in the future to increase energy production capacity.
10. Economic and Financial Considerations: Outline requirements related to cost-effectiveness, return on investment, and any relevant financial metrics for the project.

Ensure the document is thorough, technically accurate, and aligned with current renewable energy industry standards. Use appropriate energy sector terminology and provide clear explanations for technical concepts.`,

        "Financial Services": `Create a detailed requirements document for a Financial Services solution based on this idea: [USER_IDEA]

Include:
1. Project Overview and Financial Context: Provide a comprehensive summary of the financial services project, its objectives, and its potential impact on the financial sector or target market.
2. Functional Requirements: Detail all core features and functionalities, including both transactional and analytical capabilities. Describe user interactions, financial processes, and system behaviors.
3. Regulatory Compliance and Reporting Requirements: List all relevant financial regulations (e.g., GDPR, PSD2, MiFID II) and reporting standards that the solution must comply with.
4. Security and Fraud Prevention Needs: Specify robust security measures, including encryption, authentication protocols, and fraud detection systems to protect financial data and transactions.
5. Integration with Financial Systems and APIs: Describe how the solution will integrate with existing financial infrastructure, payment gateways, banking systems, or other relevant financial services.
6. User Roles and Access Control: Define different user roles (e.g., customers, financial advisors, administrators) and their specific access levels and permissions within the system.
7. Performance, Scalability, and Availability Requirements: Specify the system's performance needs, including transaction processing speeds, data handling capabilities, and uptime requirements.
8. Data Management and Analytics: Outline requirements for financial data storage, retrieval, and analysis, including any real-time reporting or predictive analytics capabilities.
9. User Interface and User Experience: Describe the requirements for intuitive, secure, and accessible user interfaces for various devices and platforms.
10. Audit Trail and Compliance Logging: Specify requirements for maintaining comprehensive audit logs for all financial transactions and system activities.

Ensure the document is thorough, clearly structured, and adheres to financial industry standards. Use appropriate financial terminology and provide clear explanations for technical and financial concepts.`,

        "Advanced Manufacturing": `Develop a comprehensive requirements document for an Advanced Manufacturing project based on this idea: [USER_IDEA]

Include:
1. Project Overview and Manufacturing Context: Provide a detailed summary of the advanced manufacturing project, its objectives, and its potential impact on the manufacturing process or industry.
2. Production Process Requirements: Outline the specific manufacturing processes involved, including automation requirements, production line specifications, and quality control measures.
3. Integration with Existing Manufacturing Systems: Describe how the new system will integrate with existing manufacturing equipment, ERP systems, or other relevant manufacturing infrastructure.
4. Data Collection and Analysis Requirements: Specify the types of data to be collected from the manufacturing process, how it will be analyzed, and how insights will be used to optimize production.
5. Quality Control and Assurance Specifications: Detail the quality control processes, including in-line inspection systems, statistical process control requirements, and traceability features.
6. Safety and Compliance Standards: List all relevant industry safety standards and regulatory compliance requirements that the manufacturing process must adhere to.
7. Scalability and Flexibility Needs: Describe how the manufacturing system can be scaled or adapted to handle different products or increased production volumes.
8. Human-Machine Interface Requirements: Specify the requirements for operator interfaces, control systems, and any augmented reality or digital twin technologies to be implemented.
9. Maintenance and Predictive Maintenance Features: Outline requirements for system maintenance, including predictive maintenance capabilities and condition monitoring.
10. Supply Chain and Inventory Management Integration: Describe how the manufacturing system will interface with supply chain management and inventory control systems.

Ensure the document is comprehensive, technically accurate, and aligned with current advanced manufacturing industry standards. Use appropriate manufacturing terminology and provide clear explanations for technical concepts.`,

        "Artificial Intelligence and Robotics": `Generate a detailed requirements document for an AI/Robotics project based on this idea: [USER_IDEA]

Include:
1. Project Overview and AI/Robotics Context: Provide a comprehensive summary of the AI/Robotics project, its objectives, and its potential impact on the target industry or application area.
2. Functional Requirements and Capabilities: Detail the core AI/Robotics functionalities, including specific AI algorithms, machine learning models, or robotic capabilities required.
3. Data Requirements and Machine Learning Objectives: Specify the types and volumes of data needed, data collection methods, and the specific machine learning objectives or AI tasks to be accomplished.
4. Hardware Specifications: For robotics projects, detail the hardware requirements, including sensors, actuators, processors, and any custom components needed.
5. Software Architecture and Framework: Outline the software architecture, including AI frameworks, robotics middleware, and any specific programming languages or tools required.
6. Integration and Interoperability Needs: Describe how the AI/Robotics system will integrate with existing systems, databases, or other relevant infrastructure.
7. Performance Metrics and Evaluation Criteria: Define clear, measurable performance indicators for the AI algorithms or robotic systems, including accuracy, speed, and efficiency targets.
8. Scalability and Learning Capabilities: Specify requirements for scaling the AI/Robotics system and for continuous learning or adaptation capabilities.
9. User Interface and Control Systems: Detail the requirements for human-AI or human-robot interfaces, including any remote control or monitoring systems.
10. Ethical Considerations and Safeguards: Address ethical implications of the AI/Robotics system, including bias mitigation, transparency, and safety measures.

Ensure the document is thorough, technically precise, and aligned with current AI and robotics industry standards. Use appropriate AI and robotics terminology and provide clear explanations for technical concepts.`
    },
    technical: {
        "Software Technology": `Create a comprehensive technical design document for a Software Technology project based on this idea: [USER_IDEA]

Include:
1. System Architecture: 
   - Provide a detailed description of the overall system structure
   - Identify and explain all major components and their interactions
   - Include high-level and low-level architecture diagrams
2. Database Design:
   - Design the database schema with detailed entity-relationship diagrams
   - Specify data models, relationships, and constraints
   - Explain the choice of database technology (e.g., SQL, NoSQL) and justify the decision
3. API Specifications:
   - List and describe all API endpoints
   - Provide detailed request/response formats for each endpoint
   - Explain authentication and authorization mechanisms for API access
4. Security Measures:
   - Outline the security architecture, including encryption methods
   - Describe user authentication and authorization processes
   - Detail strategies for protecting against common vulnerabilities (e.g., SQL injection, XSS)
5. Scalability Considerations:
   - Explain strategies for horizontal and vertical scaling
   - Describe load balancing techniques and caching strategies
   - Outline plans for handling increased user load and data growth
6. Development Stack and Tools:
   - List all technologies, frameworks, and libraries to be used
   - Justify the choice of each technology in the stack
   - Specify versions and any specific configurations required
7. Deployment Strategy:
   - Describe the deployment architecture (e.g., cloud-based, on-premises)
   - Outline the CI/CD pipeline and deployment processes
   - Explain strategies for zero-downtime deployments and rollback procedures
8. Performance Optimization:
   - Detail methods for optimizing application performance
   - Describe strategies for minimizing latency and improving response times
   - Outline plans for performance testing and monitoring
9. Error Handling and Logging:
   - Describe the error handling strategy and logging mechanisms
   - Specify how errors will be tracked, reported, and analyzed
10. Third-party Integrations:
    - List all third-party services or APIs to be integrated
    - Describe the integration methods and any data transformation requirements

Provide in-depth explanations for each section, using technical language appropriate for a development team. Include diagrams, flowcharts, or pseudocode where they would enhance understanding. Ensure that the document is comprehensive and aligned with software engineering best practices.`,

        "Healthcare and Biotech": `Develop a detailed technical design document for a Healthcare and Biotech solution based on this idea: [USER_IDEA]

Include:
1. System Architecture:
   - Describe the overall system structure, emphasizing healthcare-specific components
   - Detail the integration of medical devices or biotech instruments, if applicable
   - Include architecture diagrams showing data flow and system interactions
2. Data Model and Storage Solutions:
   - Design the database schema for storing medical or biological data
   - Specify data models for patient records, clinical data, or biotech research data
   - Explain choices for data storage solutions (e.g., HIPAA-compliant cloud storage)
3. Integration Interfaces with Medical Systems:
   - Detail integration with Electronic Health Records (EHR) systems
   - Specify interfaces with Laboratory Information Management Systems (LIMS)
   - Describe integration with medical imaging systems or biotech research tools
4. Security and Privacy Measures:
   - Outline robust security measures compliant with healthcare regulations (e.g., HIPAA)
   - Describe encryption methods for data at rest and in transit
   - Detail access control mechanisms and audit logging for sensitive medical data
5. Scalability and Performance Optimizations:
   - Explain strategies for handling large volumes of medical or genomic data
   - Describe techniques for optimizing query performance on large datasets
   - Outline plans for scaling the system to accommodate growing data and user base
6. Biotech Processes and Protocols:
   - If applicable, detail the technical implementation of specific biotech processes
   - Describe algorithms or workflows for analyzing biological data
   - Explain integration with laboratory equipment or biotech research tools
7. Regulatory Compliance Technical Measures:
   - Outline technical implementations to ensure compliance with healthcare regulations
   - Describe features for maintaining data integrity and traceability
   - Explain mechanisms for generating compliance reports and audit trails
8. User Interface Design for Healthcare Professionals:
   - Describe the design of intuitive interfaces for healthcare providers
   - Detail any mobile or tablet interfaces for point-of-care use
   - Explain accessibility features for diverse user groups in healthcare settings
9. Data Analytics and Reporting:
   - Outline the architecture for healthcare analytics and reporting
   - Describe any machine learning or AI components for medical data analysis
   - Explain data visualization techniques for complex medical or genomic data
10. Interoperability and Standards Compliance:
    - Detail compliance with healthcare data standards (e.g., HL7, FHIR, DICOM)
    - Describe implementation of standard medical terminologies (e.g., SNOMED CT, LOINC)
    - Explain how the system ensures data portability and interoperability

Provide comprehensive explanations for each section, using appropriate medical and technical terminology. Include relevant diagrams, data flow charts, or pseudocode to enhance understanding. Ensure that the document adheres to healthcare IT best practices and addresses the unique challenges of healthcare and biotech applications.`,

        "Renewable Energy": `Create a comprehensive technical design document for a Renewable Energy project based on this idea: [USER_IDEA]

Include:
1. Energy System Architecture:
   - Describe the overall structure of the renewable energy system
   - Detail components such as energy generation, storage, and distribution subsystems
   - Include system diagrams showing energy flow and component interactions
2. Power Generation and Storage Specifications:
   - Provide detailed specifications for renewable energy sources (e.g., solar panels, wind turbines)
   - Describe energy storage solutions (e.g., battery systems, pumped hydro storage)
   - Explain power conversion and conditioning systems
3. Grid Integration Design:
   - Detail the interface between the renewable energy system and the power grid
   - Describe smart grid technologies and control systems for grid stability
   - Explain strategies for managing intermittent energy production
4. Monitoring and Control Systems:
   - Outline the architecture for real-time monitoring of energy production and consumption
   - Describe control systems for optimizing energy generation and distribution
   - Detail data acquisition systems and sensor networks
5. Efficiency Optimization Techniques:
   - Explain algorithms for maximizing energy production efficiency
   - Describe methods for reducing energy losses in the system
   - Detail predictive maintenance systems to ensure optimal performance
6. Environmental Impact Mitigation Measures:
   - Describe technical solutions for minimizing environmental impact
   - Explain systems for monitoring and reporting environmental metrics
   - Detail any specific eco-friendly design elements
7. Safety Systems and Fail-safes:
   - Outline safety mechanisms and emergency shutdown procedures
   - Describe fault detection and isolation systems
   - Explain redundancy and backup systems to ensure reliability
8. Data Management and Analytics:
   - Describe the data architecture for collecting and storing energy production data
   - Outline analytics systems for performance optimization and forecasting
   - Explain any machine learning applications for energy management
9. User Interface and Reporting Systems:
   - Detail interfaces for system operators and energy managers
   - Describe dashboards for real-time monitoring and control
   - Explain reporting systems for compliance and performance analysis
10. Integration with Energy Markets:
    - Describe systems for interfacing with energy trading platforms
    - Explain algorithms for optimizing energy sales and purchases
    - Detail forecasting systems for energy production and demand

Provide in-depth technical explanations for each section, using appropriate renewable energy and engineering terminology. Include relevant diagrams, schematics, or algorithmic descriptions to enhance understanding. Ensure that the document aligns with current renewable energy industry standards and best practices.`,

        "Financial Services": `Develop a detailed technical design document for a Financial Services solution based on this idea: [USER_IDEA]

Include:
1. System Architecture:
   - Describe the overall structure of the financial system
   - Detail components such as transaction processing, risk management, and reporting subsystems
   - Include architecture diagrams showing data flow and system interactions
2. Data Model and Database Design:
   - Design the database schema for financial data, including transactions, accounts, and user information
   - Explain the choice of database technology (e.g., relational, NoSQL) and justify the decision
   - Describe data partitioning and sharding strategies for high-volume financial data
3. Security Architecture and Encryption Methods:
   - Outline robust security measures compliant with financial industry standards
   - Describe encryption methods for sensitive financial data at rest and in transit
   - Detail multi-factor authentication systems and access control mechanisms
4. Integration with Financial APIs and Services:
   - Specify integrations with payment gateways, banking systems, and financial data providers
   - Describe interfaces with stock exchanges or trading platforms, if applicable
   - Explain strategies for ensuring reliable and secure third-party integrations
5. Transaction Processing and Reconciliation Systems:
   - Detail the architecture for high-speed, high-volume transaction processing
   - Describe real-time transaction validation and fraud detection systems
   - Explain automated reconciliation processes and exception handling
6. Reporting and Analytics Engine:
   - Outline the architecture for financial reporting and analytics
   - Describe real-time data processing for financial insights and risk assessment
   - Explain any machine learning or AI components for predictive analytics
7. Disaster Recovery and Business Continuity Measures:
   - Detail strategies for ensuring high availability and fault tolerance
   - Describe backup systems and data replication methods
   - Explain the disaster recovery plan and failover procedures
8. Scalability and Performance Optimization:
   - Describe strategies for handling peak transaction loads
   - Explain caching mechanisms and database query optimization techniques
   - Outline plans for horizontal and vertical scaling of the system
9. Compliance and Audit Systems:
   - Detail technical implementations to ensure regulatory compliance (e.g., AML, KYC)
   - Describe systems for generating audit trails and compliance reports
   - Explain mechanisms for adapting to changing financial regulations
10. User Interface and Customer Experience:
    - Describe the architecture for responsive and secure user interfaces
    - Detail any mobile banking or trading app architectures
    - Explain personalization engines and recommendation systems, if applicable

Provide comprehensive technical explanations for each section, using appropriate financial and technical terminology. Include relevant diagrams, data flow charts, or pseudocode to enhance understanding. Ensure that the document adheres to financial industry best practices and addresses the unique challenges of financial technology applications.`,

        "Advanced Manufacturing": `Create a comprehensive technical design document for an Advanced Manufacturing project based on this idea: [USER_IDEA]

Include:
1. Manufacturing Process Flow and Systems Integration:
   - Describe the overall manufacturing process architecture
   - Detail the integration of various manufacturing systems (e.g., CNC machines, robotics, assembly lines)
   - Include process flow diagrams and system interaction models
2. IoT and Sensor Network Architecture:
   - Outline the architecture for IoT devices and sensors in the manufacturing environment
   - Describe data collection methods and protocols for real-time monitoring
   - Explain edge computing implementations for local data processing
3. Real-time Data Processing and Analytics Systems:
   - Detail the architecture for processing high-volume, real-time manufacturing data
   - Describe data storage solutions for time-series data from sensors and equipment
   - Explain analytics systems for predictive maintenance and process optimization
4. Robotics and Automation Specifications:
   - Provide detailed specifications for robotic systems and automated equipment
   - Describe control systems and programming interfaces for automated processes
   - Explain safety systems and human-robot collaboration frameworks
5. Quality Control and Defect Detection Systems:
   - Outline computer vision and AI systems for automated quality inspection
   - Describe data analysis techniques for identifying manufacturing defects
   - Explain integration of quality control systems with the production line
6. Supply Chain Integration and Inventory Management:
   - Detail systems for real-time inventory tracking and management
   - Describe integration with supplier systems and logistics platforms
   - Explain demand forecasting algorithms and just-in-time manufacturing implementations
7. Energy Efficiency and Waste Reduction Measures:
   - Outline systems for monitoring and optimizing energy consumption
   - Describe technical solutions for minimizing waste in the manufacturing process
   - Explain implementation of circular economy principles in the system design
8. Digital Twin and Simulation Systems:
   - Describe the architecture for creating and maintaining digital twins of manufacturing processes
   - Detail simulation systems for process optimization and scenario planning
   - Explain how digital twins integrate with real-time data from the production floor
9. Human-Machine Interfaces and Operator Support Systems:
   - Outline the design of intuitive interfaces for machine operators
   - Describe augmented reality systems for maintenance and operator guidance
   - Explain decision support systems and dashboards for production management
10. Data Security and Intellectual Property Protection:
    - Detail security measures for protecting sensitive manufacturing data and designs
    - Describe access control systems and data encryption methods
    - Explain strategies for securing the entire manufacturing technology stack

Provide in-depth technical explanations for each section, using appropriate manufacturing and engineering terminology. Include relevant diagrams, schematics, or algorithmic descriptions to enhance understanding. Ensure that the document aligns with Industry 4.0 principles and advanced manufacturing best practices.`,

        "Artificial Intelligence and Robotics": `Develop a detailed technical design document for an AI/Robotics project based on this idea: [USER_IDEA]

Include:
1. AI Model Architecture and Algorithms:
   - Describe the overall AI system architecture
   - Detail the specific AI algorithms and machine learning models to be used
   - Explain the rationale behind the chosen AI approaches
2. Data Pipeline and Processing Systems:
   - Outline the data ingestion and preprocessing architecture
   - Describe data cleaning, normalization, and feature extraction processes
   - Explain data storage solutions for training and inference datasets
3. Machine Learning Training Infrastructure:
   - Detail the infrastructure for training AI models (e.g., GPU clusters, cloud services)
   - Describe distributed training strategies for large-scale models
   - Explain version control and experiment tracking for ML models
4. Robotics Hardware Specifications:
   - Provide detailed specifications for robotic components (e.g., actuators, sensors)
   - Describe the mechanical design and materials used in the robot
   - Explain power systems and energy management for the robotic platform
5. Sensor Integration and Data Fusion Techniques:
   - Outline the architecture for integrating multiple sensor types
   - Describe sensor fusion algorithms for combining data from various sources
   - Explain calibration and synchronization methods for sensor data
6. Real-time Decision Making and Control Systems:
   - Detail the architecture for real-time AI inference and decision making
   - Describe control systems for translating AI decisions into robotic actions
   - Explain strategies for ensuring deterministic behavior in critical scenarios
7. Human-AI/Robot Interaction Interfaces:
   - Outline the design of user interfaces for controlling and monitoring the AI/robotic system
   - Describe natural language processing components for human-AI communication
   - Explain safety systems for human-robot collaboration scenarios
8. Performance Optimization and Efficiency:
   - Detail methods for optimizing AI model performance and reducing inference time
   - Describe techniques for energy-efficient operation of the robotic system
   - Explain strategies for balancing computational load between edge devices and central processors
9. Ethical AI and Safety Measures:
   - Outline systems for ensuring ethical AI behavior and decision-making
   - Describe fail-safe mechanisms and emergency shutdown procedures
   - Explain transparency and explainability features of the AI system
10. Scalability and Continuous Learning:
    - Detail the architecture for scaling the AI/robotic system to multiple units
    - Describe systems for continuous learning and model updating in production
    - Explain strategies for managing and deploying model updates across the system

Provide comprehensive technical explanations for each section, using appropriate AI, robotics, and engineering terminology. Include relevant diagrams, flowcharts, or pseudocode to enhance understanding. Ensure that the document addresses the unique challenges of integrating AI with robotic systems and adheres to best practices in both fields.`
    },
    lifecycle: {
        "Software Technology": `Outline a comprehensive product lifecycle for a Software Technology project based on this idea: [USER_IDEA]

Include:
1. Concept and Planning:
   - Detail the initial ideation process and market research
   - Describe the product vision and strategy development
   - Outline the process for defining initial requirements and feasibility studies
   - Explain stakeholder identification and initial project scoping
2. Design and Development Phases:
   - Break down the design phase, including UI/UX design principles and processes
   - Outline the chosen development methodology (e.g., Agile, Scrum, Kanban)
   - Describe the development environment setup and version control strategies
   - Explain the coding standards, code review processes, and documentation practices
3. Testing and Quality Assurance:
   - Detail different types of testing (unit, integration, system, user acceptance)
   - Describe the QA process, including test planning and execution
   - Outline the bug tracking and resolution process
   - Explain performance testing and security audit procedures
4. Deployment and Launch:
   - Describe the deployment strategy (e.g., phased rollout, blue-green deployment)
   - Outline the CI/CD pipeline and automated deployment processes
   - Detail the launch plan, including beta testing and soft launch strategies
   - Explain post-launch monitoring and support procedures
5. Maintenance and Support:
   - Describe the process for gathering and prioritizing user feedback
   - Outline the strategy for regular updates and feature additions
   - Detail the approach to technical debt management and system refactoring
   - Explain the support infrastructure, including ticketing systems and SLAs
6. Updates and Versioning:
   - Outline the versioning strategy for the software
   - Describe the process for planning and implementing major updates
   - Detail the communication strategy for keeping users informed about changes
   - Explain backwards compatibility considerations and deprecation policies
7. End-of-Life Considerations:
   - Describe the criteria for determining the product's end-of-life
   - Outline the process for sunsetting the product, including user migration
   - Detail data archiving or migration strategies
   - Explain the long-term support plan for enterprise clients, if applicable

Provide insights into each stage of the product's lifecycle, including best practices, potential challenges, and strategies for success. Use real-world examples or case studies where appropriate to illustrate key points. Ensure that the document covers the entire lifespan of the software product, from inception to retirement.`,

        "Healthcare and Biotech": `Create a detailed product lifecycle document for a Healthcare and Biotech solution based on this idea: [USER_IDEA]

Include:
1. Research and Discovery Phase:
   - Outline the initial scientific research and literature review process
   - Describe the identification of unmet medical needs or biotech opportunities
   - Detail the process of hypothesis formation and initial proof-of-concept studies
   - Explain intellectual property considerations and patent landscape analysis
2. Preclinical Development:
   - Describe the design and execution of laboratory studies or in vitro experiments
   - Outline animal testing procedures and ethical considerations, if applicable
   - Detail the process of optimizing the product formulation or technology
   - Explain data collection, analysis, and reporting methods for preclinical results
3. Clinical Trials:
   - Break down the phases of clinical trials (Phase I, II, III, and potentially IV)
   - Describe patient recruitment strategies and ethical approval processes
   - Outline data management and statistical analysis plans for clinical data
   - Explain safety monitoring procedures and adverse event reporting
4. Regulatory Approval Process:
   - Detail the preparation and submission of regulatory documents (e.g., IND, NDA, 510(k))
   - Describe interactions with regulatory bodies (e.g., FDA, EMA) throughout the process
   - Outline strategies for addressing regulatory questions and requirements
   - Explain post-approval regulatory compliance and reporting obligations
5. Manufacturing and Quality Control:
   - Describe the scale-up process from lab to commercial production
   - Outline Good Manufacturing Practice (GMP) implementation and compliance
   - Detail quality control measures and batch testing procedures
   - Explain supply chain management and raw material sourcing strategies
6. Market Launch and Distribution:
   - Describe marketing and education strategies for healthcare providers and patients
   - Outline the sales and distribution model (e.g., direct sales, distributors)
   - Detail pricing strategies and reimbursement considerations
   - Explain the process of integrating the product into existing healthcare systems
7. Post-Market Surveillance and Updates:
   - Describe systems for monitoring product safety and efficacy in real-world use
   - Outline processes for gathering and analyzing post-market data
   - Detail procedures for implementing product updates or improvements
   - Explain strategies for expanding indications or applications of the product

Provide comprehensive insights into each stage of the healthcare/biotech product lifecycle, including industry-specific best practices, regulatory considerations, and potential challenges. Use relevant case studies or examples to illustrate key points. Ensure that the document addresses the unique aspects of bringing a healthcare or biotech product from conception to market and beyond.`,

        "Renewable Energy": `Develop a comprehensive project lifecycle document for a Renewable Energy project based on this idea: [USER_IDEA]

Include:
1. Concept Development and Feasibility Studies:
   - Outline the initial idea generation and renewable energy resource assessment
   - Describe preliminary technical and economic feasibility studies
   - Detail market analysis and energy demand forecasting
   - Explain initial stakeholder engagement and community consultation processes
2. Site Selection and Environmental Impact Assessment:
   - Describe the site selection criteria and evaluation process
   - Outline geographical and topographical assessments
   - Detail the environmental impact assessment methodology
   - Explain biodiversity
   considerations and mitigation strategies
3. Design and Engineering Phase:
   - Describe the detailed system design process for the chosen renewable technology
   - Outline energy yield calculations and optimization strategies
   - Detail electrical system design, including grid connection plans
   - Explain the selection of key components and technologies
4. Permitting and Approvals:
   - List all required permits and licenses for the project
   - Describe the process of engaging with local, state, and federal authorities
   - Outline strategies for addressing regulatory challenges
   - Explain public consultation processes and community engagement plans
5. Construction and Installation:
   - Detail the construction planning and site preparation processes
   - Describe the installation procedures for renewable energy equipment
   - Outline quality control measures during construction
   - Explain health and safety protocols for the construction phase
6. Commissioning and Grid Connection:
   - Describe the system testing and commissioning process
   - Outline procedures for grid connection and compliance testing
   - Detail performance verification and acceptance criteria
   - Explain handover procedures to operations teams
7. Operations, Maintenance, and Upgrades:
   - Describe ongoing operational procedures and monitoring systems
   - Outline preventive maintenance schedules and procedures
   - Detail strategies for performance optimization and efficiency improvements
   - Explain plans for future upgrades or expansions of the system
8. End-of-Life and Decommissioning:
   - Describe criteria for determining the end of the project's operational life
   - Outline decommissioning procedures and site restoration plans
   - Detail recycling and waste management strategies for equipment
   - Explain potential repowering or site redevelopment options

Provide insights into each stage of the renewable energy project's lifecycle, including industry-specific best practices, regulatory considerations, and potential challenges. Use relevant case studies or examples to illustrate key points. Ensure that the document addresses the unique aspects of developing and operating a renewable energy project, from conception to decommissioning.`,

        "Financial Services": `Outline a detailed product lifecycle for a Financial Services solution based on this idea: [USER_IDEA]

Include:
1. Concept Development and Market Analysis:
   - Describe the initial idea generation process and identification of market needs
   - Outline competitor analysis and market positioning strategy
   - Detail financial modeling and preliminary ROI calculations
   - Explain the process of defining the unique value proposition
2. Regulatory Compliance Planning:
   - Identify all relevant financial regulations and compliance requirements
   - Describe the process of engaging with regulatory bodies
   - Outline the development of compliance frameworks and policies
   - Explain strategies for staying updated with changing regulations
3. Design and Development Phases:
   - Break down the product design phase, including UX/UI for financial interfaces
   - Describe the chosen development methodology (e.g., Agile, Waterfall)
   - Outline the process of building secure financial transaction systems
   - Explain integration planning with existing financial infrastructure
4. Security Audits and Penetration Testing:
   - Detail the security assessment and audit processes
   - Describe penetration testing procedures and frequency
   - Outline vulnerability management and remediation processes
   - Explain ongoing security monitoring and incident response planning
5. Beta Testing with Financial Institutions:
   - Describe the selection process for beta testing partners
   - Outline the beta testing protocol and data collection methods
   - Detail the feedback incorporation and product refinement process
   - Explain performance benchmarking against existing solutions
6. Phased Rollout and Market Adoption:
   - Describe the staged rollout strategy to different market segments
   - Outline customer onboarding and training processes
   - Detail marketing and customer acquisition strategies
   - Explain metrics for measuring market adoption and success
7. Ongoing Compliance Updates and Feature Enhancements:
   - Describe processes for monitoring regulatory changes
   - Outline procedures for implementing compliance updates
   - Detail the roadmap for feature enhancements and product evolution
   - Explain strategies for gathering and prioritizing customer feedback
8. Scaling and Expansion:
   - Describe plans for scaling the solution to handle increased transaction volumes
   - Outline strategies for expanding into new markets or financial sectors
   - Detail partnerships or integrations to enhance product offerings
   - Explain approaches to internationalizing the product
9. Data Management and Analytics:
   - Describe ongoing data management practices and compliance
   - Outline the development of analytics capabilities for financial insights
   - Detail strategies for leveraging big data in financial services
   - Explain data retention and archiving policies
10. Product Maturity and Potential Exit Strategies:
    - Describe indicators of product maturity in the financial market
    - Outline potential exit strategies (e.g., acquisition, IPO)
    - Detail long-term support plans for enterprise clients
    - Explain strategies for maintaining market relevance

Provide comprehensive insights into each stage of the financial service product's lifecycle, including industry-specific best practices, regulatory considerations, and potential challenges. Use relevant case studies or examples from the financial sector to illustrate key points. Ensure that the document addresses the unique aspects of developing and maintaining a financial services product, with a strong emphasis on security, compliance, and trust-building with customers.`,

        "Advanced Manufacturing": `Create a comprehensive project lifecycle document for an Advanced Manufacturing project based on this idea: [USER_IDEA]

Include:
1. Concept Development and Feasibility Analysis:
   - Describe the initial ideation process and identification of manufacturing needs
   - Outline the preliminary technical feasibility studies
   - Detail market analysis and demand forecasting for the manufactured product
   - Explain initial cost-benefit analysis and ROI projections
2. Process Design and Simulation:
   - Describe the development of detailed manufacturing process flows
   - Outline the use of simulation tools for process optimization
   - Detail the selection of advanced manufacturing technologies and equipment
   - Explain the integration of IoT and data analytics in the process design
3. Prototype Development and Testing:
   - Describe the creation of initial prototypes or proof-of-concept models
   - Outline testing procedures for validating manufacturing processes
   - Detail quality control measures and performance benchmarks
   - Explain iterative refinement processes based on prototype results
4. Pilot Production Phase:
   - Describe the setup of a pilot production line
   - Outline scaling strategies from prototype to pilot production
   - Detail data collection and analysis methods during the pilot phase
   - Explain how pilot results inform full-scale implementation plans
5. Full-Scale Implementation and Integration:
   - Describe the transition from pilot to full-scale production
   - Outline the integration with existing manufacturing systems
   - Detail employee training programs for new technologies
   - Explain change management strategies for organizational adaptation
6. Optimization and Continuous Improvement:
   - Describe ongoing process optimization techniques
   - Outline the implementation of lean manufacturing principles
   - Detail predictive maintenance strategies for equipment
   - Explain continuous quality improvement processes
7. Technology Refresh and Upgrade Cycles:
   - Describe plans for regular technology assessments
   - Outline strategies for incorporating emerging manufacturing technologies
   - Detail upgrade processes for software and hardware components
   - Explain how to manage technology obsolescence
8. Supply Chain Integration:
   - Describe the integration of advanced manufacturing with supply chain systems
   - Outline strategies for real-time inventory management
   - Detail supplier collaboration and just-in-time manufacturing approaches
   - Explain risk management in the high-tech supply chain
9. Sustainability and Environmental Considerations:
   - Describe energy efficiency measures in the manufacturing process
   - Outline waste reduction and recycling strategies
   - Detail the use of sustainable materials and processes
   - Explain compliance with environmental regulations and standards
10. End-of-Life and Decommissioning:
    - Describe criteria for phasing out outdated manufacturing processes
    - Outline procedures for decommissioning and replacing equipment
    - Detail strategies for repurposing or recycling manufacturing technology
    - Explain knowledge transfer processes for future manufacturing projects

Provide in-depth insights into each stage of the advanced manufacturing project's lifecycle, including industry-specific best practices, technological considerations, and potential challenges. Use relevant case studies or examples from the manufacturing sector to illustrate key points. Ensure that the document addresses the unique aspects of implementing and maintaining advanced manufacturing processes, with a focus on innovation, efficiency, and adaptability to rapid technological changes.`,

        "Artificial Intelligence and Robotics": `Develop a detailed product lifecycle document for an AI/Robotics project based on this idea: [USER_IDEA]

Include:
1. Concept Development and Ethical Considerations:
   - Describe the initial AI/robotics concept and its potential applications
   - Outline the process of identifying target markets and use cases
   - Detail preliminary ethical assessments and potential societal impacts
   - Explain strategies for ensuring responsible AI development from the outset
2. Data Collection and Preparation:
   - Describe methods for acquiring or generating relevant training data
   - Outline data cleaning, labeling, and augmentation processes
   - Detail strategies for ensuring data privacy and security
   - Explain techniques for addressing potential biases in the dataset
3. Model Development and Training:
   - Describe the selection and development of AI algorithms or neural network architectures
   - Outline the iterative training process and hyperparameter optimization
   - Detail techniques for improving model accuracy and reducing overfitting
   - Explain strategies for model interpretability and explainability
4. Robotics Hardware Integration (if applicable):
   - Describe the design and prototyping of robotic components
   - Outline the integration of AI models with robotic hardware
   - Detail sensor selection and integration for environmental interaction
   - Explain power management and efficiency considerations
5. Iterative Testing and Refinement:
   - Describe comprehensive testing protocols for AI models and robotic systems
   - Outline procedures for identifying and addressing failure modes
   - Detail performance benchmarking against existing solutions
   - Explain the process of refining models based on test results
6. Deployment and Integration:
   - Describe strategies for deploying AI models in production environments
   - Outline processes for integrating AI/robotic systems with existing infrastructure
   - Detail user training programs and documentation development
   - Explain monitoring systems for deployed AI/robotic solutions
7. Monitoring and Performance Tuning:
   - Describe methods for real-time monitoring of AI/robotic system performance
   - Outline processes for gathering and analyzing user feedback
   - Detail strategies for identifying and mitigating potential AI biases in operation
   - Explain techniques for optimizing system performance and efficiency
8. Continuous Learning and Model Updates:
   - Describe mechanisms for continuous learning from new data
   - Outline processes for regular model retraining and validation
   - Detail version control and rollback procedures for AI models
   - Explain strategies for managing model drift and ensuring long-term reliability
9. Scaling and Expansion:
   - Describe plans for scaling the AI/robotics solution to handle increased demand
   - Outline strategies for expanding into new applications or markets
   - Detail approaches to customizing the solution for different use cases
   - Explain methods for managing computational resources at scale
10. Long-term Maintenance and Evolution:
    - Describe long-term support and maintenance plans
    - Outline strategies for adapting to evolving AI technologies and methodologies
    - Detail plans for managing the product's evolution over time
    - Explain approaches to handling obsolescence of AI models or robotic components

Provide comprehensive insights into each stage of the AI/robotics product's lifecycle, including industry-specific best practices, ethical considerations, and potential challenges. Use relevant case studies or examples from the AI and robotics sector to illustrate key points. Ensure that the document addresses the unique aspects of developing and maintaining AI and robotics solutions, with a strong emphasis on ethical AI, continuous improvement, and adaptability to rapid technological advancements.`
    }
};

app.post('/api/user-input', async (req, res) => {
    try {
        const { idea, domain } = req.body;

        const userInput = new UserInput({ idea, domain });
        await userInput.save();

        res.status(201).json({ message: 'User input saved', id: userInput._id });
    } catch (error) {
        res.status(500).json({ error: 'Error saving user input' });
    }
});

async function generateDocument(userInputId, documentType) {
    const userInput = await UserInput.findById(userInputId);
    if (!userInput) {
        throw new Error('User input not found');
    }

    const promptTemplate = domainSpecificPrompts[documentType][userInput.domain];
    if (!promptTemplate) {
        throw new Error('Invalid domain or document type');
    }

    let prompt = promptTemplate.replace('[USER_IDEA]', userInput.idea);

    const content = await generateDocument(prompt);

    const document = new GeneratedDocument({
        userInputId: userInput._id,
        content: content,
        domain: userInput.domain,
        
    });
    await document.save();

    return content;
}

app.get('/api/generate-document/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const content = await generateDocument(id, type);
        res.json({ document: content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/revise-document/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const { revisionPrompt } = req.body;

        const document = await GeneratedDocument.findOne({ userInputId: id, type: type });
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const promptTemplate = domainSpecificPrompts[type][document.domain];
        if (!promptTemplate) {
            return res.status(400).json({ error: 'Invalid domain or document type' });
        }

        const userInput = await UserInput.findById(id);
        let prompt = `${promptTemplate.replace('[USER_IDEA]', userInput.idea)}

Current document content:
${document.content}

Revision request: ${revisionPrompt}

Please provide a revised version of the document incorporating the requested changes while maintaining the overall structure and completeness of the original document.`;

        const revisedContent = await generateDocument(prompt);

        document.content = revisedContent;
        await document.save();

        res.json({ document: revisedContent });
    } catch (error) {
        res.status(500).json({ error: 'Error revising document' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
