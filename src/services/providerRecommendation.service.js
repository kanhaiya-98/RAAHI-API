const { getModel } = require('../config/gemini');
const logger = require('../utils/logger');

/**
 * Provider Recommendation Service
 * Analyzes bids and user priority to recommend the best provider
 */
class ProviderRecommendationService {
    /**
     * Recommend best provider based on user priority
     * @param {Array} bids - Array of bid objects
     * @param {Object} taskDetails - Task information
     * @param {string} userPriority - User's priority (lowest_price, today_service, best_rated, etc.)
     * @returns {Promise<Object>} Recommendation with justification
     */
    async recommendProvider(bids, taskDetails, userPriority = 'best_value') {
        try {
            const model = getModel();

            const prompt = `You are an AI recommendation engine for a service marketplace.

Task Details:
- Service Category: ${taskDetails.service_category}
- Urgency: ${taskDetails.urgency}
- Estimated Price: ₹${taskDetails.price_min}-₹${taskDetails.price_max}

Available Bids:
${bids.map((bid, idx) => `
Bid ${idx + 1}:
- Price: ₹${bid.bid_amount}
- Provider Rating: ${bid.provider_rating || 'N/A'}/5
- Experience: ${bid.provider_experience || 0} years
- Completed Jobs: ${bid.provider_completed_jobs || 0}
- Availability: ${bid.estimated_hours ? `${bid.estimated_hours} hours` : 'Not specified'}
- Message: ${bid.message || 'N/A'}
`).join('\n')}

User Priority: ${userPriority}

Analyze ALL bids and recommend the SINGLE BEST provider considering the user's priority.

Return ONLY valid JSON:
{
  "recommended_bid_index": <0-based index>,
  "recommended_price": <bid amount>,
  "confidence_score": <1-100>,
  "justification": [
    "<reason 1>",
    "<reason 2>",
    "<reason 3>"
  ],
  "trade_offs": "<any compromises being made>"
}`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Parse JSON from response
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const recommendation = JSON.parse(cleanedText);

            logger.info('Provider recommendation generated', {
                recommended_index: recommendation.recommended_bid_index,
                confidence: recommendation.confidence_score
            });

            return {
                success: true,
                recommendation: {
                    ...recommendation,
                    recommended_provider: bids[recommendation.recommended_bid_index]
                }
            };

        } catch (error) {
            logger.error('Provider recommendation failed:', error);

            // Fallback: Simple rule-based recommendation
            return this._fallbackRecommendation(bids, userPriority, taskDetails);
        }
    }

    /**
     * Fallback recommendation logic
     */
    _fallbackRecommendation(bids, userPriority, taskDetails) {
        let recommendedBid;
        let justification = [];

        switch (userPriority) {
            case 'lowest_price':
                recommendedBid = bids.reduce((min, bid) =>
                    bid.bid_amount < min.bid_amount ? bid : min
                );
                justification = ['Lowest price among all bids', 'Budget-friendly option'];
                break;

            case 'best_rated':
                recommendedBid = bids.reduce((max, bid) =>
                    (bid.provider_rating || 0) > (max.provider_rating || 0) ? bid : max
                );
                justification = ['Highest rated provider', 'Quality service expected'];
                break;

            case 'fastest_service':
                recommendedBid = bids.reduce((min, bid) =>
                    (bid.estimated_hours || 999) < (min.estimated_hours || 999) ? bid : min
                );
                justification = ['Quickest availability', 'Fast service delivery'];
                break;

            default: // best_value
                recommendedBid = bids.find(bid =>
                    bid.bid_amount >= taskDetails.price_min &&
                    bid.bid_amount <= taskDetails.price_max &&
                    (bid.provider_rating || 0) >= 4.0
                ) || bids[0];
                justification = ['Good balance of price and quality', 'Within estimated range'];
        }

        return {
            success: true,
            recommendation: {
                recommended_bid_index: bids.indexOf(recommendedBid),
                recommended_price: recommendedBid.bid_amount,
                confidence_score: 75,
                justification,
                trade_offs: 'Using rule-based fallback',
                recommended_provider: recommendedBid
            }
        };
    }
}

module.exports = new ProviderRecommendationService();
