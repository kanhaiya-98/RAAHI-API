const { getModel } = require('../config/gemini');
const logger = require('../utils/logger');

/**
 * Base Gemini service for AI operations
 */
class GeminiService {
    /**
     * Generate content using Gemini with JSON parsing
     * @param {string} prompt - The prompt to send to Gemini
     * @param {number} maxRetries - Maximum number of retries
     * @returns {object} Parsed JSON response
     */
    async generateJSON(prompt, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const model = getModel();
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();

                // Clean up markdown code blocks if present
                text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                // Parse JSON
                const jsonData = JSON.parse(text);

                logger.debug('Gemini JSON response generated successfully', {
                    attempt,
                    promptLength: prompt.length,
                    responseLength: text.length
                });

                return jsonData;
            } catch (error) {
                lastError = error;
                logger.warn(`Gemini API attempt ${attempt} failed:`, {
                    error: error.message,
                    attempt,
                    maxRetries
                });

                if (attempt < maxRetries) {
                    // Wait before retry with exponential backoff
                    const waitTime = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }

        logger.error('Gemini API failed after all retries:', lastError);
        throw new Error(`AI service unavailable: ${lastError.message}`);
    }

    /**
     * Generate simple text content
     * @param {string} prompt - The prompt to send to Gemini
     * @returns {string} Generated text
     */
    async generateText(prompt) {
        try {
            const model = getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            logger.error('Gemini text generation failed:', error);
            throw new Error(`AI service error: ${error.message}`);
        }
    }
}

module.exports = new GeminiService();
