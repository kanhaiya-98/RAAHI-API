const geminiService = require('./gemini.service');
const logger = require('../utils/logger');

/**
 * AI-powered bid analysis service
 */
class BidAnalysisService {
    /**
     * Analyze and compare bids for a task
     * @param {string} taskId - Task ID
     * @param {array} bids - Array of bid objects with provider details
     * @param {object} priceEstimate - AI price estimate {min, max}
     * @param {string} customerPriority - Priority: best_value, lowest_price, fastest_service, highest_rated
     * @returns {object} Bid analysis and recommendations
     */
    async analyzeBids(taskId, bids, priceEstimate, customerPriority = 'best_value') {
        try {
            if (!bids || bids.length === 0) {
                return this.getEmptyAnalysis();
            }

            if (bids.length === 1) {
                return this.getSingleBidAnalysis(bids[0], priceEstimate);
            }

            const prompt = this.buildPrompt(bids, priceEstimate, customerPriority);
            const analysis = await geminiService.generateJSON(prompt);

            logger.info('Bids analyzed successfully', {
                taskId,
                bidCount: bids.length,
                recommended: analysis.recommended?.bid_id
            });

            return analysis;
        } catch (error) {
            logger.error('Bid analysis failed:', error);
            return this.getFallbackAnalysis(bids, priceEstimate);
        }
    }

    /**
     * Build the Gemini prompt for bid analysis
     */
    buildPrompt(bids, priceEstimate, customerPriority) {
        const bidsJson = JSON.stringify(bids, null, 2);

        return `You are an expert advisor helping customers choose the best service provider.

Task Price Estimate: ₹${priceEstimate.min} - ₹${priceEstimate.max}
Customer Priority: ${customerPriority} (options: best_value, lowest_price, fastest_service, highest_rated)

Available Bids (with provider details):
${bidsJson}

Analyze all bids and provide a comprehensive comparison.

Return ONLY valid JSON (no markdown):
{
  "best_value": {
    "bid_id": "uuid",
    "provider_name": "name",
    "price": number,
    "reason": "why this is best value"
  },
  "budget_option": {
    "bid_id": "uuid",
    "provider_name": "name",
    "price": number,
    "reason": "why choose this for budget"
  },
  "fastest_service": {
    "bid_id": "uuid",
    "provider_name": "name",
    "reason": "why this is fastest"
  },
  "premium_choice": {
    "bid_id": "uuid",
    "provider_name": "name",
    "reason": "why this is premium"
  },
  "recommended": {
    "bid_id": "uuid",
    "confidence_score": number (0-100),
    "justification": ["reason1", "reason2", "reason3"]
  },
  "price_insights": {
    "average_bid": number,
    "lowest_bid": number,
    "highest_bid": number,
    "compared_to_estimate": "within/above/below range",
    "value_assessment": "text explanation"
  },
  "warnings": ["any red flags or concerns"]
}`;
    }

    /**
     * Get analysis for empty bid list
     */
    getEmptyAnalysis() {
        return {
            message: 'No bids available yet',
            recommendations: null,
            price_insights: null
        };
    }

    /**
     * Get analysis for single bid
     */
    getSingleBidAnalysis(bid, priceEstimate) {
        const withinRange = bid.bid_amount >= priceEstimate.min_price &&
            bid.bid_amount <= priceEstimate.max_price;

        return {
            best_value: {
                bid_id: bid.bid_id || bid.id,
                provider_name: bid.provider_name,
                price: bid.bid_amount,
                reason: 'Only bid available'
            },
            recommended: {
                bid_id: bid.bid_id || bid.id,
                confidence_score: withinRange ? 70 : 50,
                justification: [
                    'Only bid received',
                    withinRange ? 'Price within estimated range' : 'Price outside estimated range',
                    `Provider rating: ${bid.rating || 'N/A'}`
                ]
            },
            price_insights: {
                average_bid: bid.bid_amount,
                lowest_bid: bid.bid_amount,
                highest_bid: bid.bid_amount,
                compared_to_estimate: withinRange ? 'within' : (bid.bid_amount < priceEstimate.min_price ? 'below' : 'above') + ' range',
                value_assessment: 'Single bid - limited comparison available'
            },
            warnings: withinRange ? [] : ['Price significantly different from estimate']
        };
    }

    /**
     * Get fallback analysis using simple logic
     */
    getFallbackAnalysis(bids, priceEstimate) {
        const sortedByPrice = [...bids].sort((a, b) => a.bid_amount - b.bid_amount);
        const sortedByRating = [...bids].sort((a, b) => (b.rating || 0) - (a.rating || 0));

        const prices = bids.map(b => b.bid_amount);
        const avgBid = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

        // Find best value (good rating, reasonable price)
        const bestValue = bids.find(bid =>
            (bid.rating || 0) >= 4.0 &&
            bid.bid_amount <= avgBid * 1.2
        ) || bids[0];

        return {
            best_value: {
                bid_id: bestValue.bid_id || bestValue.id,
                provider_name: bestValue.provider_name,
                price: bestValue.bid_amount,
                reason: 'Good balance of price and provider rating'
            },
            budget_option: {
                bid_id: sortedByPrice[0].bid_id || sortedByPrice[0].id,
                provider_name: sortedByPrice[0].provider_name,
                price: sortedByPrice[0].bid_amount,
                reason: 'Lowest price among all bids'
            },
            premium_choice: {
                bid_id: sortedByRating[0].bid_id || sortedByRating[0].id,
                provider_name: sortedByRating[0].provider_name,
                reason: 'Highest rated provider'
            },
            recommended: {
                bid_id: bestValue.bid_id || bestValue.id,
                confidence_score: 60,
                justification: [
                    'Balanced choice considering price and rating',
                    'Fallback analysis applied',
                    'Manual review recommended'
                ]
            },
            price_insights: {
                average_bid: avgBid,
                lowest_bid: Math.min(...prices),
                highest_bid: Math.max(...prices),
                compared_to_estimate: avgBid >= priceEstimate.min_price && avgBid <= priceEstimate.max_price ? 'within' : 'outside' + ' range',
                value_assessment: `Average bid is ₹${avgBid}, estimate was ₹${priceEstimate.min_price}-₹${priceEstimate.max_price}`
            },
            warnings: []
        };
    }
}

module.exports = new BidAnalysisService();
