import { Request, Response } from 'express';
import axios from 'axios';
import Thumbnail from '../models/Thumbnail.js';
import ai from '../configs/ai.js';
import cloudinary from '../configs/cloudinary.js';

/* =====================================================
   PREMIUM THUMBNAIL STYLE PROMPTS
===================================================== */

const stylePrompts = {
    'Bold & Graphic': `
premium viral YouTube thumbnail design,
bold visual storytelling, dramatic subject,
vibrant colors, powerful contrast,
dynamic composition, expressive visuals,
high-impact commercial artwork
`,

    'Tech/Futuristic': `
premium futuristic YouTube thumbnail,
advanced technology, holographic interfaces,
neon lighting, cyberpunk atmosphere,
glowing digital elements, cinematic sci-fi design,
high-end commercial advertising quality
`,

    Minimalist: `
luxury minimalist YouTube thumbnail,
clean professional composition,
simple but powerful visual storytelling,
elegant color palette, perfect spacing,
strong focal point, premium editorial design
`,

    Photorealistic: `
ultra-realistic cinematic YouTube thumbnail,
professional DSLR photography,
natural realistic textures,
dramatic cinematic lighting,
sharp details, realistic depth of field,
high-end commercial photography
`,

    Illustrated: `
premium digital illustration YouTube thumbnail,
highly detailed artwork, expressive characters,
beautiful color grading, bold outlines,
dynamic perspective, polished professional illustration
`,
};

/* =====================================================
   PREMIUM COLOR SCHEMES
===================================================== */

const colorSchemeDescriptions = {
    vibrant: `
highly vibrant colors,
rich saturation, bold contrast,
energetic color grading,
bright highlights and deep shadows
`,

    sunset: `
cinematic sunset color palette,
orange, red, pink and purple tones,
warm golden light, atmospheric glow,
premium movie-poster color grading
`,

    forest: `
rich emerald green, deep forest tones,
earthy colors, natural contrast,
mysterious atmospheric lighting,
fresh organic cinematic palette
`,

    neon: `
electric blue, magenta and purple neon,
glowing cyberpunk accents,
high contrast, futuristic lighting,
premium nightlife color grading
`,

    purple: `
luxury purple, violet and magenta tones,
deep shadows, elegant highlights,
modern premium visual identity
`,

    monochrome: `
dramatic black and white color grading,
strong shadows, powerful highlights,
high contrast, cinematic timeless mood
`,

    ocean: `
deep blue and teal tones,
fresh aquatic atmosphere,
cinematic cool lighting,
clean professional color grading
`,

    pastel: `
soft premium pastel colors,
gentle highlights, subtle shadows,
modern friendly aesthetic,
clean polished visual design
`,
};

type ThumbnailStyle = keyof typeof stylePrompts;
type ColorScheme = keyof typeof colorSchemeDescriptions;

/* =====================================================
   ENHANCE USER PROMPT USING GROQ
===================================================== */

const enhancePromptWithGroq = async ({
    title,
    userPrompt,
    style,
    colorScheme,
    aspectRatio,
    textOverlay,
}: {
    title: string;
    userPrompt?: string;
    style?: string;
    colorScheme?: string;
    aspectRatio?: string;
    textOverlay?: string;
}) => {
    const selectedStyle =
        stylePrompts[style as ThumbnailStyle] ||
        stylePrompts['Bold & Graphic'];

    const selectedColor =
        colorSchemeDescriptions[colorScheme as ColorScheme] ||
        colorSchemeDescriptions.vibrant;

    const textInstruction = textOverlay
        ? `
Leave a clean and balanced empty area where this text can be added later:
"${textOverlay}"

Do not generate any text inside the image.
`
        : `
Leave clean negative space for optional typography.
Do not generate any text inside the image.
`;

    const groqPrompt = `
You are a world-class creative director, cinematic photographer,
professional YouTube thumbnail designer and AI image prompt engineer.

Your task is to create ONE extremely detailed, premium-quality image
generation prompt for a professional YouTube thumbnail.

The final image must look like it was designed by an expert creative agency
for a high-performing YouTube channel.

VIDEO TITLE:
${title}

USER IDEA:
${userPrompt || 'Create a powerful visual concept based on the video title.'}

THUMBNAIL STYLE:
${selectedStyle}

COLOR PALETTE:
${selectedColor}

ASPECT RATIO:
${aspectRatio || '16:9'}

TEXT REQUIREMENT:
${textOverlay || 'No text specified'}

MANDATORY VISUAL QUALITY:
- Ultra-detailed 4K UHD quality.
- Premium cinematic composition.
- Professional commercial advertising quality.
- Sharp focus on the main subject.
- Realistic textures and fine details.
- Dramatic cinematic lighting.
- Beautiful highlights and deep shadows.
- Strong foreground, middle-ground and background separation.
- Professional depth of field.
- Dynamic camera angle.
- Powerful visual storytelling.
- Clear and instantly understandable main subject.
- Strong contrast and excellent color grading.
- Eye-catching composition suitable for YouTube.
- Make the main subject large and visually dominant.
- Use visual hierarchy and balanced composition.
- Make the image look premium, polished and expensive.
- Avoid boring stock-photo composition.
- Avoid flat lighting and empty visuals.
- Avoid clutter and unnecessary objects.
- Do not create logos, signatures, website names or watermarks.
- Do not create random, distorted or unreadable text.
- Do not add text inside the image.
${textInstruction}

Write only the final image-generation prompt.
Do not explain your answer.
Do not add headings.
`;

    const completion = await ai.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
            {
                role: 'system',
                content:
                    'You are an expert cinematic YouTube thumbnail prompt engineer.',
            },
            {
                role: 'user',
                content: groqPrompt,
            },
        ],
        temperature: 0.75,
        max_tokens: 1100,
    });

    const generatedPrompt =
        completion.choices[0]?.message?.content?.trim();

    return (
        generatedPrompt ||
        `
${selectedStyle},
${title},
${selectedColor},
ultra-detailed 4K UHD,
cinematic lighting,
professional YouTube thumbnail,
dramatic composition,
sharp focus,
premium commercial quality,
no text,
no logo,
no watermark
`
    );
};

/* =====================================================
   GENERATE IMAGE USING POLLINATIONS AI
===================================================== */

const generateImageWithPollinations = async (
    prompt: string,
    aspectRatio: string = '16:9'
): Promise<Buffer> => {
    let width = 1920;
    let height = 1080;

    switch (aspectRatio) {
        case '1:1':
            width = 1536;
            height = 1536;
            break;

        case '9:16':
            width = 1080;
            height = 1920;
            break;

        case '4:5':
            width = 1280;
            height = 1600;
            break;

        case '4:3':
            width = 1600;
            height = 1200;
            break;

        case '16:9':
        default:
            width = 1920;
            height = 1080;
            break;
    }

    const finalPrompt = `
${prompt}

FINAL QUALITY INSTRUCTIONS:
ultra-detailed 4K UHD,
high-resolution professional artwork,
cinematic commercial lighting,
sharp focus,
realistic textures,
premium color grading,
dramatic atmosphere,
professional YouTube thumbnail composition,
strong subject separation,
high contrast,
visually compelling,
clean background,
no watermark,
no logo,
no signature,
no website text,
no random text
`;

    const encodedPrompt = encodeURIComponent(finalPrompt);

    const imageUrl =
        `https://image.pollinations.ai/prompt/${encodedPrompt}` +
        `?width=${width}` +
        `&height=${height}` +
        `&nologo=true` +
        `&enhance=true` +
        `&model=flux`;

    console.log('Pollinations image URL prepared.');
    console.log(`Image dimensions: ${width}x${height}`);

    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 180000,
        headers: {
            Accept: 'image/*',
        },
    });

    if (!response.data || response.data.length === 0) {
        throw new Error('Pollinations returned an empty image.');
    }

    return Buffer.from(response.data);
};

/* =====================================================
   GENERATE THUMBNAIL CONTROLLER
===================================================== */

export const generateThumbnail = async (
    req: Request,
    res: Response
) => {
    let thumbnail: any = null;

    try {
        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({
                message: 'Unauthorized. Please login again.',
            });
        }

        const {
            title,
            prompt: user_prompt,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay,
        } = req.body;

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                message: 'Thumbnail title is required.',
            });
        }

        const selectedAspectRatio = aspect_ratio || '16:9';

        thumbnail = await Thumbnail.create({
            userId,
            title: title.trim(),
            prompt_used: user_prompt || '',
            user_prompt: user_prompt || '',
            style: style || 'Bold & Graphic',
            aspect_ratio: selectedAspectRatio,
            color_scheme: color_scheme || 'vibrant',
            text_overlay: text_overlay || '',
            isGenerating: true,
        });

        console.log('========================================');
        console.log('THUMBNAIL GENERATION STARTED');
        console.log('========================================');

        console.log('Step 1: Enhancing prompt using Groq...');

        const enhancedPrompt = await enhancePromptWithGroq({
            title: title.trim(),
            userPrompt: user_prompt,
            style,
            colorScheme: color_scheme,
            aspectRatio: selectedAspectRatio,
            textOverlay: text_overlay,
        });

        console.log('Step 2: Groq prompt generated successfully.');
        console.log('Step 3: Generating premium image with Pollinations AI...');

        const finalBuffer = await generateImageWithPollinations(
            enhancedPrompt,
            selectedAspectRatio
        );

        if (!finalBuffer || finalBuffer.length === 0) {
            throw new Error('Image generation returned an empty image.');
        }

        console.log('Step 4: Uploading image to Cloudinary...');

        const base64Image = `data:image/png;base64,${finalBuffer.toString(
            'base64'
        )}`;

        const uploadResult = await cloudinary.uploader.upload(
            base64Image,
            {
                resource_type: 'image',
                folder: 'thumblify/thumbnails',
                transformation: [
                    {
                        quality: 'auto:best',
                        fetch_format: 'auto',
                    },
                ],
            }
        );

        thumbnail.image_url = uploadResult.secure_url;
        thumbnail.prompt_used = enhancedPrompt;
        thumbnail.isGenerating = false;

        await thumbnail.save();

        console.log('========================================');
        console.log('THUMBNAIL GENERATED SUCCESSFULLY');
        console.log('========================================');

        return res.status(200).json({
            message: 'Thumbnail Generated Successfully',
            thumbnail,
        });
    } catch (error: any) {
        console.error('========================================');
        console.error('THUMBNAIL GENERATION ERROR');
        console.error('========================================');
        console.error(error);

        if (thumbnail) {
            thumbnail.isGenerating = false;
            await thumbnail.save();
        }

        const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to generate thumbnail.';

        return res.status(500).json({
            message: errorMessage,
        });
    }
};

/* =====================================================
   DELETE THUMBNAIL CONTROLLER
===================================================== */

export const deleteThumbnail = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({
                message: 'Unauthorized. Please login again.',
            });
        }

        const deletedThumbnail = await Thumbnail.findOneAndDelete({
            _id: id,
            userId,
        });

        if (!deletedThumbnail) {
            return res.status(404).json({
                message: 'Thumbnail not found.',
            });
        }

        return res.status(200).json({
            message: 'Thumbnail deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete thumbnail error:', error);

        return res.status(500).json({
            message:
                error?.message || 'Failed to delete thumbnail.',
        });
    }
};