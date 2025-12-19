const { getModel } = require('../config/gemini');
const logger = require('../utils/logger');

/**
 * Booking Confidence Score Service
 * Generates explainable confidence scores for booking decisions
 */
class BookingConfidenceService {
    /**
     * Generate confidence score for a booking decision
     * @param {Object} provider - Provider details
     * @param {Object} bid - Bid details
     * @param {Object} taskDetails - Task information
     * @returns {Promise<Object>} Confidence score with explanation
     */
    async generateConfidenceScore(provider, bid, taskDetails) {
        try {
            const model = getModel();

            // Calculate price alignment
            const priceAlignment = this._calculatePriceAlignment(
                bid.bid_amount,
                taskDetails.price_min,
                taskDetails.price_max
            );

            const prompt = `You are an AI confidence scoring system for service bookings.

Provider Profile:
- Rating: ${provider.rating || 'N/A'}/5
- Experience: ${provider.experience_years || 0} years
- Total Jobs: ${provider.total_jobs || 0}
- Completed Jobs: ${provider.completed_jobs || 0}
- Verification Status: ${provider.verification_status || 'pending'}

Bid Details:
- Bid Amount: ₹${bid.bid_amount}
- Estimated Hours: ${bid.estimated_hours || 'N/A'}
- Provider Message: ${bid.message || 'None'}

Task Context:
- Service Category: ${taskDetails.service_category}
- Complexity: ${taskDetails.complexity}
- Urgency: ${taskDetails.urgency}
- Estimated Price Range: ₹${taskDetails.price_min}-₹${taskDetails.price_max}
- Price Alignment: ${priceAlignment}

Analyze this booking decision and generate a confidence score (0-100) with detailed explanation.

Return ONLY valid JSON:
{
  "confidence_score": <0-100>,
  "confidence_level": "low|medium|high|very_high",
  "explanation": [
    "<positive factor 1>",
    "<positive factor 2>",
    "<positive factor 3>"
  ],
  "risk_factors": [
    "<potential risk 1 if any>",
    "<potential risk 2 if any>"
  ],
  "recommendation": "<book_confidently|book_with_caution|consider_alternatives>"
}`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Parse JSON
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const confidenceData = JSON.parse(cleanedText);

            logger.info('Confidence score generated', {
                score: confidenceData.confidence_score,
                level: confidenceData.confidence_level
            });

            return {
                success: true,
                confidence: confidenceData
            };

        } catch (error) {
            logger.error('Confidence score generation failed:', error);

            // Fallback confidence calculation
            return this._fallbackConfidence(provider, bid, taskDetails);
        }
    }

    /**
     * Calculate price alignment
     */
    _calculatePriceAlignment(bidAmount, minPrice, maxPrice) {
        if (bidAmount < minPrice) return 'below_range';
        if (bidAmount > maxPrice) return 'above_range';

        const midPoint = (minPrice + maxPrice) / 2;
        const deviation = Math.abs(bidAmount - midPoint) / midPoint;

        if (deviation < 0.1) return 'perfect_match';
        if (deviation < 0.2) return 'within_range';
        return 'range_edge';
    }

    /**
     * Fallback confidence calculation
     */
    _fallbackConfidence(provider, bid, taskDetails) {
        let score = 50; // Base score
        const explanation = [];
        const riskFactors = [];

        // Provider rating factor (0-25 points)
        if (provider.rating >= 4.5) {
            score += 25;
            explanation.push('Provider has excellent ratings');
        } else if (provider.rating >= 4.0) {
            score += 15;
            explanation.push('Provider has good ratings');
        } else if (provider.rating >= 3.0) {
            score += 5;
            explanation.push('Provider has average ratings');
        } else {
            riskFactors.push('Provider has below-average ratings');
        }

        // Experience factor (0-15 points)
        if (provider.experience_years >= 5) {
            score += 15;
            explanation.push('Provider has significant experience');
        } else if (provider.experience_years >= 2) {
            score += 10;
            explanation.push('Provider has moderate experience');
        }

        // Completed jobs factor (0-15 points)
        if (provider.completed_jobs >= 50) {
            score += 15;
            explanation.push('Provider has completed many jobs successfully');
        } else if (provider.completed_jobs >= 10) {
            score += 10;
            explanation.push('Provider has a good track record');
        } else if (provider.completed_jobs < 5) {
            riskFactors.push('Provider has limited job history');
        }

        // Price alignment factor (0-20 points)
        const priceAlignment = this._calculatePriceAlignment(
            bid.bid_amount,
            taskDetails.price_min,
            taskDetails.price_max
        );

        if (priceAlignment === 'perfect_match' || priceAlignment === 'within_range') {
            score += 20;
            explanation.push('Price is within expected range');
        } else if (priceAlignment === 'below_range') {
            score += 10;
            explanation.push('Price is below expected range');
            riskFactors.push('Unusually low price may indicate quality concerns');
        } else if (priceAlignment === 'above_range') {
            riskFactors.push('Price is above expected range');
        }

        // Verification status (0-10 points)
        if (provider.verification_status === 'verified') {
            score += 10;
            explanation.push('Provider is verified by platform');
        } else {
            riskFactors.push('Provider verification pending');
        }

        // Determine confidence level
        let confidenceLevel, recommendation;
        if (score >= 85) {
            confidenceLevel = 'very_high';
            recommendation = 'book_confidently';
        } else if (score >= 70) {
            confidenceLevel = 'high';
            recommendation = 'book_confidently';
        } else if (score >= 50) {
            confidenceLevel = 'medium';
            recommendation = 'book_with_caution';
        } else {
            confidenceLevel = 'low';
            recommendation = 'consider_alternatives';
        }

        return {
            success: true,
            confidence: {
                confidence_score: Math.min(100, score),
                confidence_level: confidenceLevel,
                explanation,
                risk_factors: riskFactors.length > 0 ? riskFactors : ['No significant risks identified'],
                recommendation
            }
        };
    }
}

module.exports = new BookingConfidenceService();
