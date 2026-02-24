import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Test: generateImages with imagen - no negativePrompt
async function testImagen() {
  console.log('\n--- Test: generateImages with imagen-3.0-generate-002 (no negativePrompt) ---');
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: 'Low quality amateur phone photo of a young man on a couch in a messy apartment, bad lighting, washed out, not professional, flat focus no bokeh',
      config: {
        aspectRatio: '9:16',
        numberOfImages: 1,
      },
    });
    console.log('SUCCESS.');
    if (response.generatedImages && response.generatedImages.length > 0) {
      const img = response.generatedImages[0];
      console.log('Got image. Bytes length:', img.image?.imageBytes?.length || 'none');
      if (img.enhancedPrompt) console.log('Enhanced prompt:', img.enhancedPrompt);
    }
  } catch (err) {
    console.log('FAILED:', err.message);
  }
}

// Test: generateImages with Nano Banana model
async function testNBGenerateImages() {
  console.log('\n--- Test: generateImages with gemini-2.5-flash-image ---');
  try {
    const response = await ai.models.generateImages({
      model: 'gemini-2.5-flash-image',
      prompt: 'Low quality amateur phone photo of a young man on a couch in a messy apartment, bad lighting, washed out',
      config: {
        aspectRatio: '9:16',
        numberOfImages: 1,
      },
    });
    console.log('SUCCESS.');
    if (response.generatedImages && response.generatedImages.length > 0) {
      const img = response.generatedImages[0];
      console.log('Got image. Bytes length:', img.image?.imageBytes?.length || 'none');
    }
  } catch (err) {
    console.log('FAILED:', err.message);
  }
}

// Test: compare base64 sizes between imageSize 1K and default
async function testSizeComparison() {
  console.log('\n--- Test: imageSize comparison ---');

  const prompt = 'A young man sitting on couch in messy apartment';

  // Default (no imageSize)
  try {
    const r1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { imageConfig: { aspectRatio: '9:16' } },
    });
    const p1 = r1.candidates[0].content.parts.find(p => p.inlineData);
    console.log('Default size - base64 length:', p1?.inlineData?.data?.length || 'none');
  } catch (err) {
    console.log('Default FAILED:', err.message);
  }

  // With imageSize: "1K" (should be lower res)
  try {
    const r2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { imageConfig: { aspectRatio: '9:16', imageSize: '1K' } },
    });
    const p2 = r2.candidates[0].content.parts.find(p => p.inlineData);
    console.log('1K size - base64 length:', p2?.inlineData?.data?.length || 'none');
  } catch (err) {
    console.log('1K FAILED:', err.message);
  }
}

await testImagen();
await testNBGenerateImages();
await testSizeComparison();
