const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

// 1. camelCase Generator (/api/seo/generate)
router.post('/generate', async (req, res) => {
  const { productName, category, description } = req.body || {};
  
  try {
    if (!productName || !String(productName).trim()) {
      return res.status(400).json({ error: 'productName is required for SEO generation.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const isPlaceholderKey = !apiKey || apiKey.includes('yahan-dalen') || apiKey === 'your_anthropic_api_key_here';

    if (isPlaceholderKey) {
      console.log('No valid ANTHROPIC_API_KEY found (placeholder or missing). Generating simulated camelCase SEO data...');
      
      // Artificial delay to simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const simulatedSeoData = {
        seoTitle: `Buy ${productName} | Premium ${category && category !== 'all' ? category : 'Quality'}`,
        metaDescription: `Shop the best ${productName} today. ${description ? description.slice(0, 80) + '...' : 'High quality and affordable.'} Get yours now at ShopGalaxy!`,
        keywords: `${productName.toLowerCase()}, buy online, ${category || 'store'}, premium quality, shopgalaxy`,
        altText: `High quality view of ${productName}`
      };
      
      return res.json(simulatedSeoData);
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const prompt = `You are an expert SEO copywriter. Please generate SEO metadata for the following product:
Product Name: ${productName}
Category: ${category}
Description: ${description}

Return ONLY a raw JSON object (without any markdown code blocks or wrapper text) with the following structure:
{
  "seoTitle": "SEO Title here (max 60 chars)",
  "metaDescription": "Meta description here (max 160 chars)",
  "keywords": "3-5 focus keywords, comma separated",
  "altText": "Descriptive alt text for the product image"
}`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    });

    const generatedText = msg.content[0].text;
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const seoData = JSON.parse(jsonMatch[0]);
    res.json({
      seoTitle: seoData.seoTitle || `Buy ${productName}`,
      metaDescription: seoData.metaDescription || `Shop ${productName} now!`,
      keywords: seoData.keywords || '',
      altText: seoData.altText || productName
    });

  } catch (error) {
    console.error('Error generating SEO, falling back to simulated data:', error);
    
    // Graceful fallback to simulated camelCase SEO data in case of error
    const cat = category && category !== 'all' ? category : 'Quality';
    const descSnippet = description ? String(description).slice(0, 80) + '...' : 'High quality and affordable.';
    
    const simulatedSeoData = {
      seoTitle: `Buy ${productName} | Premium ${cat}`.slice(0, 60),
      metaDescription: `Shop the best ${productName} today. ${descSnippet} Get yours now at ShopGalaxy!`.slice(0, 160),
      keywords: `${productName ? productName.toLowerCase() : 'product'}, buy online, ${category || 'store'}, premium quality, shopgalaxy`,
      altText: `High quality view of ${productName}`
    };
    
    return res.json(simulatedSeoData);
  }
});

// 2. snake_case Generator (/api/products/generate-seo)
router.post('/generate-seo', async (req, res) => {
  try {
    const { name, category, description } = req.body;
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('No ANTHROPIC_API_KEY found. Generating simulated SEO data for free...');
      
      // Artificial delay to simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const simulatedSeoData = {
        seo_title: `Buy ${name || 'Product'} | Premium ${category && category !== 'all' ? category : 'Quality'}`,
        seo_description: `Shop the best ${name || 'item'} today. ${description ? description.slice(0, 80) + '...' : 'High quality and affordable.'} Get yours now at ShopGalaxy!`,
        keywords: `${name ? name.toLowerCase() : 'product'}, buy online, ${category || 'store'}, premium quality, shopgalaxy`,
        alt_text: `High quality view of ${name || 'the product'}`
      };
      
      return res.json(simulatedSeoData);
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are an expert SEO copywriter. Please generate SEO metadata for the following product:
Name: ${name}
Category: ${category}
Description: ${description}

Return ONLY a raw JSON object (without any markdown code blocks or wrapper text) with the following structure:
{
  "seo_title": "SEO Title here (max 60 chars)",
  "seo_description": "Meta description here (max 160 chars)",
  "keywords": "3-5 focus keywords, comma separated",
  "alt_text": "Descriptive alt text for the product image"
}`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    });

    const generatedText = msg.content[0].text;
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const seoData = JSON.parse(jsonMatch[0]);
    res.json(seoData);

  } catch (error) {
    console.error('Error generating SEO:', error);
    res.status(500).json({ error: 'Server error while generating SEO' });
  }
});

module.exports = router;
