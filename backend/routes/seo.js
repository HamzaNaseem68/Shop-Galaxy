const express = require('express')
const Anthropic = require('@anthropic-ai/sdk')

const router = express.Router()
const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

function buildFallbackSeo({ name, category, description }) {
  const cat = category && category !== 'all' ? category : 'quality'
  const descSnippet = description ? String(description).slice(0, 80) + '...' : 'High quality and affordable.'
  return {
    seo_title: `Buy ${name || 'Product'} | Premium ${cat}`.slice(0, 60),
    seo_description: `Shop ${name || 'this product'} online in Pakistan. ${descSnippet} Order now at ShopGalaxy.`.slice(0, 160),
    keywords: [name, category, 'buy online', 'shopgalaxy', 'pakistan']
      .filter(Boolean)
      .join(', '),
    alt_text: `Product image of ${name || 'item'} — ${category || 'ecommerce'}`,
  }
}

router.post('/generate-seo', async (req, res) => {
  try {
    const { name, category, description } = req.body || {}

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Product name is required for SEO generation.' })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json(buildFallbackSeo({ name, category, description }))
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are an expert ecommerce SEO copywriter for a Pakistani online store (prices in PKR).

Product name: ${name}
Category: ${category || 'general'}
Description: ${description || 'No description provided.'}

Return ONLY valid JSON (no markdown) with:
{
  "seo_title": "max 60 characters",
  "seo_description": "max 160 characters",
  "keywords": "3-5 comma-separated focus keywords",
  "alt_text": "descriptive image alt text for accessibility"
}`

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const generatedText = msg.content[0]?.text || ''
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return res.json(buildFallbackSeo({ name, category, description }))
    }

    const seoData = JSON.parse(jsonMatch[0])

    res.json({
      seo_title: String(seoData.seo_title || '').slice(0, 60),
      seo_description: String(seoData.seo_description || '').slice(0, 160),
      keywords: seoData.keywords || '',
      alt_text: seoData.alt_text || '',
    })
  } catch (error) {
    console.error('SEO generation error:', error)
    const { name, category, description } = req.body || {}
    res.json(buildFallbackSeo({ name, category, description }))
  }
})

module.exports = router
