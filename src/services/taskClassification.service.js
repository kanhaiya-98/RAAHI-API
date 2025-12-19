const geminiService = require('./gemini.service');
const logger = require('../utils/logger');

/**
 * AI-powered task classification service
 */
class TaskClassificationService {
    /**
     * Classify a task description using Gemini AI
     * @param {string} taskDescription - The task description (supports Hindi/Hinglish/English)
     * @param {string} location - Location string
     * @returns {object} Classification results
     */
    async classifyTask(taskDescription, location = 'India') {
        try {
            const prompt = this.buildPrompt(taskDescription, location);
            const classification = await geminiService.generateJSON(prompt);

            // Validate required fields
            this.validateClassification(classification);

            logger.info('Task classified successfully', {
                category: classification.service_category,
                complexity: classification.complexity
            });

            return classification;
        } catch (error) {
            logger.error('Task classification failed:', error);

            // Return fallback classification
            return this.getFallbackClassification();
        }
    }

    /**
     * Build the Gemini prompt for task classification
     */
    buildPrompt(taskDescription, location) {
        return `You are an expert service classifier for home services in India.

Analyze this service request and classify it accurately.

Task Description: ${taskDescription}
Location: ${location}

Available Service Categories:
- Plumbing
- Electrical
- Carpentry
- AC Repair
- Appliance Repair
- Painting
- Pest Control
- Home Cleaning
- Gardening
- Interior Design

Complexity Levels:
- Low: Simple, quick fixes (under 1 hour)
- Medium: Standard repairs (1-3 hours)
- High: Complex work (3+ hours or multiple sessions)

Urgency Levels:
- Low: Can wait 2-3 days
- Medium: Needed within 1-2 days
- High: Urgent, same day needed

Return ONLY valid JSON (no markdown):
{
  "service_category": "exact category from list",
  "issue_type": "specific problem description",
  "complexity": "Low/Medium/High",
  "urgency": "Low/Medium/High",
  "estimated_duration_hours": number,
  "key_details": ["detail1", "detail2"],
  "reasoning": "brief explanation"
}`;
    }

    /**
     * Validate classification response
     */
    validateClassification(classification) {
        const required = ['service_category', 'issue_type', 'complexity', 'urgency'];
        const missing = required.filter(field => !classification[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Validate complexity
        const validComplexity = ['Low', 'Medium', 'High'];
        if (!validComplexity.includes(classification.complexity)) {
            classification.complexity = 'Medium'; // Default
        }

        // Validate urgency
        const validUrgency = ['Low', 'Medium', 'High'];
        if (!validUrgency.includes(classification.urgency)) {
            classification.urgency = 'Medium'; // Default
        }

        return true;
    }

    /**
     * Get fallback classification when AI fails
     */
    getFallbackClassification() {
        return {
            service_category: 'General Service',
            issue_type: 'Service request',
            complexity: 'Medium',
            urgency: 'Medium',
            estimated_duration_hours: 2,
            key_details: ['Manual classification needed'],
            reasoning: 'AI classification unavailable, using fallback'
        };
    }
}

module.exports = new TaskClassificationService();
