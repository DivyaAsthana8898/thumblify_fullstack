import { Request, Response } from 'express';
import axios from 'axios';
import Thumbnail from '../models/Thumbnail.js';
import ai from '../configs/ai.js';
import cloudinary from '../configs/cloudinary.js';

const stylePrompts = {
    'Bold & Graphic':
        'eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional YouTube thumbnail style',

    'Tech/Futuristic':
        'futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere',

    Minimalist:
        'minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point',

    Photorealistic:
        'photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field',

    Illustrated:
        'illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style',
};

const colorSchemeDescriptions = {
    vibrant:
        'vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette',

    sunset:
        'warm sunset tones, orange, pink and purple hues, soft gradients, cinematic glow',

    forest:
        'natural green tones, earthy colors, calm and organic palette, fresh atmosphere',

    neon:
        'neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow',

    purple:
        'purple-dominant color palette, magenta and violet tones, modern and stylish mood',

    monochrome:
        'black and white color scheme, high contrast, dramatic lighting, timeless aesthetic',

    ocean:
        'cool blue and teal tones, aquatic color palette, fresh and clean atmosphere',

    pastel:
        'soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic',
};

type ThumbnailStyle = keyof typeof stylePrompts;
type ColorScheme = keyof typeof colorSchemeDescriptions;

/**
 * Generate an enhanced image prompt using Groq
 */
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
    const styleDescription =
        stylePrompts[style as ThumbnailStyle] ||
        stylePrompts['Bold & Graphic'];

    const colorDescription = colorScheme
        ? colorSchemeDescriptions[colorScheme as ColorScheme] || colorScheme
        : 'professional high-contrast colors';

    const groqPrompt = `
You are an expert YouTube thumbnail prompt engineer.

Create one detailed image-generation prompt for a highly clickable YouTube thumbnail.

Video title:
${title}

User instructions:
${userPrompt || 'No additional instructions'}

Visual style:
${styleDescription}

Color scheme:
${colorDescription}

Aspect ratio:
${aspectRatio || '16:9'}

Text overlay:
${textOverlay || 'No text overlay specified'}

Requirements:
- Make the image visually attractive and professional.
- Use strong composition and a clear focal point.
- Include cinematic lighting and high visual contrast.
- Do not explain anything.
- Return only the final image-generation prompt.
`;

    const completion = await ai.chat.completions.create({
      model: 'openai/gpt-oss-120b',

        messages: [
            {
                role: 'system',
                content:
                    'You create detailed and effective prompts for AI image generation.',
            },

            {
                role: 'user',
                content: groqPrompt,
            },
            
        ],
        temperature: 0.8,
        max_tokens: 700,
    });

    return (
        completion.choices[0]?.message?.content?.trim() ||
        `${styleDescription}, ${title}, ${colorDescription}, professional YouTube thumbnail`
    );
};

/**
 * Generate image using Pollinations AI
 */
const generateImageWithPollinations = async (
    prompt: string,
    aspectRatio: string = '16:9'
): Promise<Buffer> => {
    let width = 1280;
    let height = 720;

    if (aspectRatio === '1:1') {
        width = 1024;
        height = 1024;
    } else if (aspectRatio === '4:5') {
        width = 1024;
        height = 1280;
    } else if (aspectRatio === '9:16') {
        width = 720;
        height = 1280;
    } else if (aspectRatio === '4:3') {
        width = 1024;
        height = 768;
    }

    const encodedPrompt = encodeURIComponent(prompt);

    const imageUrl =
        `https://image.pollinations.ai/prompt/${encodedPrompt}` +
        `?width=${width}` +
        `&height=${height}` +
        `&nologo=true` +
        `&enhance=true`;

    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
    });

    return Buffer.from(response.data);
};

/**
 * Generate Thumbnail
 */
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

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Thumbnail title is required.',
            });
        }

        thumbnail = await Thumbnail.create({
            userId,
            title,
            prompt_used: user_prompt || '',
            user_prompt: user_prompt || '',
            style,
            aspect_ratio: aspect_ratio || '16:9',
            color_scheme,
            text_overlay,
            isGenerating: true,
        });

        console.log('Enhancing prompt using Groq...');

        const enhancedPrompt = await enhancePromptWithGroq({
            title,
            userPrompt: user_prompt,
            style,
            colorScheme: color_scheme,
            aspectRatio: aspect_ratio,
            textOverlay: text_overlay,
        });

        console.log('Enhanced prompt:', enhancedPrompt);
        console.log('Generating image using Pollinations AI...');

        const finalBuffer = await generateImageWithPollinations(
            enhancedPrompt,
            aspect_ratio || '16:9'
        );

        if (!finalBuffer || finalBuffer.length === 0) {
            throw new Error('Image generation returned an empty image.');
        }

        const base64Image = `data:image/png;base64,${finalBuffer.toString(
            'base64'
        )}`;

        console.log('Uploading image to Cloudinary...');

        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            resource_type: 'image',
            folder: 'thumblify/thumbnails',
        });

        thumbnail.image_url = uploadResult.secure_url;
        thumbnail.isGenerating = false;
        thumbnail.prompt_used = enhancedPrompt;

        await thumbnail.save();

        return res.status(200).json({
            message: 'Thumbnail Generated Successfully',
            thumbnail,
        });
    } catch (error: any) {
        console.error('Thumbnail generation error:', error);

        if (thumbnail) {
            thumbnail.isGenerating = false;
            await thumbnail.save();
        }

        return res.status(500).json({
            message:
                error?.response?.data?.message ||
                error?.message ||
                'Failed to generate thumbnail.',
        });
    }
};

/**
 * Delete Thumbnail
 */
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
            message: error?.message || 'Failed to delete thumbnail.',
        });
    }
};