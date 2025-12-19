const geminiService = require('./gemini.service');
const logger = require('../utils/logger');

/**
 * AI-powered price estimation service
 */
class PriceEstimationService {
    /**
     * Estimate price for a service task
     * @param {string} serviceCategory - Service category
     * @param {string} complexity - Low/Medium/High
     * @param {string} issueType - Specific issue description
     * @param {string} location - Location string
     * @returns {object} Price estimation
     */
    async estimatePrice(serviceCategory, complexity, issueType, location = 'Mumbai') {
        try {
            const prompt = this.buildPrompt(serviceCategory, complexity, issueType, location);
            const estimation = await geminiService.generateJSON(prompt);

            // Validate and ensure reasonable prices
            this.validateEstimation(estimation);

            logger.info('Price estimated successfully', {
                category: serviceCategory,
                minPrice: estimation.min_price,
                maxPrice: estimation.max_price
            });

            return estimation;
        } catch (error) {
            logger.error('Price estimation failed:', error);

            // Return fallback estimation
            return this.getFallbackEstimation(serviceCategory, complexity);
        }
    }

    /**
     * Build the Gemini prompt for price estimation
     */
    buildPrompt(serviceCategory, complexity, issueType, location) {
        return `You are a pricing expert for home services in India.

Estimate a fair price range for this service request.

Service Category: ${serviceCategory}
Issue Type: ${issueType}
Complexity: ${complexity}
Location: ${location}

Consider:
1. Local market rates in ${location}
2. Complexity level and time required
3. Material costs (if any)
4. Labor charges typical for this service
5. Travel costs
6. Standard industry rates in India

Return ONLY valid JSON (no markdown):
{
  "min_price": number (in rupees),
  "max_price": number (in rupees),
  "average_price": number,
  "price_breakdown": {
    "labor": number,
    "materials": number,
    "travel": number
  },
  "reasoning": ["reason1", "reason2", "reason3"],
  "confidence": "High/Medium/Low",
  "market_comparison": "below/at/above market average"
}`;
    }

    /**
     * Validate price estimation
     */
    validateEstimation(estimation) {
        // Ensure min and max prices exist and are valid
        if (!estimation.min_price || estimation.min_price <= 0) {
            estimation.min_price = 500;
        }

        if (!estimation.max_price || estimation.max_price <= estimation.min_price) {
            estimation.max_price = estimation.min_price * 1.5;
        }

        // Calculate average if not provided
        if (!estimation.average_price) {
            estimation.average_price = Math.round((estimation.min_price + estimation.max_price) / 2);
        }

        // Ensure price breakdown exists
        if (!estimation.price_breakdown) {
            estimation.price_breakdown = {
                labor: Math.round(estimation.average_price * 0.6),
                materials: Math.round(estimation.average_price * 0.3),
                travel: Math.round(estimation.average_price * 0.1)
            };
        }

        // Ensure confidence level
        if (!['High', 'Medium', 'Low'].includes(estimation.confidence)) {
            estimation.confidence = 'Medium';
        }

        return true;
    }

    /**
     * Get fallback price estimation
     */
    getFallbackEstimation(serviceCategory, complexity) {
        // Base prices by complexity
        const basePrices = {
            'Low': { min: 300, max: 600 },
            'Medium': { min: 800, max: 1500 },
            'High': { min: 2000, max: 4000 }
        };

        const prices = basePrices[complexity] || basePrices['Medium'];
        const average = Math.round((prices.min + prices.max) / 2);

        return {
            min_price: prices.min,
            max_price: prices.max,
            average_price: average,
            price_breakdown: {
                labor: Math.round(average * 0.6),
                materials: Math.round(average * 0.3),
                travel: Math.round(average * 0.1)
            },
            reasoning: [
                'Fallback pricing based on complexity',
                `${complexity} complexity service`,
                'Standard market rates applied'
            ],
            confidence: 'Low',
            market_comparison: 'at market average'
        };
    }

    /**
     * Adjust price for city
     */
    adjustPriceForCity(basePrice, city) {
        const cityMultipliers = {
            'Mumbai': 1.2,
            'Delhi': 1.15,
            'Bangalore': 1.1,
            'Chennai': 1.0,
            'Kolkata': 1.0,
            'Hyderabad': 1.0,
            'Pune': 1.1
        };

        const multiplier = cityMultipliers[city] || 1.0;
        return Math.round(basePrice * multiplier);
    }
}

module.exports = new PriceEstimationService();
