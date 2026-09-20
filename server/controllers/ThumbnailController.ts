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
bold visual storytelling,
strong focal point,
dramatic subject presentation,
vibrant controlled colors,
powerful contrast,
dynamic but clean composition,
high-impact commercial artwork
`,

    'Tech/Futuristic': `
premium futuristic YouTube thumbnail,
advanced technology atmosphere,
modern digital interfaces,
controlled neon lighting,
cinematic technology environment,
high-end commercial advertising quality,
clean futuristic composition
`,

    Minimalist: `
luxury minimalist YouTube thumbnail,
clean professional composition,
simple but powerful visual storytelling,
elegant color palette,
perfect spacing,
strong focal point,
premium editorial design
`,

    Photorealistic: `
ultra-realistic cinematic YouTube thumbnail,
professional DSLR photography,
natural realistic textures,
dramatic cinematic lighting,
sharp details,
realistic depth of field,
high-end commercial photography
`,

    Illustrated: `
premium digital illustration YouTube thumbnail,
highly detailed artwork,
beautiful color grading,
bold polished visual design,
dynamic perspective,
professional illustration quality
`,
};

/* =====================================================
   PREMIUM COLOR SCHEMES
===================================================== */

const colorSchemeDescriptions = {
    vibrant: `
highly vibrant colors,
rich saturation,
bold controlled contrast,
energetic color grading,
bright highlights,
deep shadows
`,

    sunset: `
cinematic sunset color palette,
orange, red, pink and purple tones,
warm golden light,
atmospheric glow,
premium movie-poster color grading
`,

    forest: `
rich emerald green,
deep forest tones,
earthy colors,
natural contrast,
mysterious atmospheric lighting,
fresh organic cinematic palette
`,

    neon: `
electric blue,
magenta and purple neon,
controlled cyberpunk accents,
high contrast,
futuristic lighting,
premium nightlife color grading
`,

    purple: `
luxury purple,
violet and magenta tones,
deep shadows,
elegant highlights,
modern premium visual identity
`,

    monochrome: `
dramatic black and white color grading,
strong shadows,
powerful highlights,
high contrast,
cinematic timeless mood
`,

    ocean: `
deep blue and teal tones,
fresh aquatic atmosphere,
cinematic cool lighting,
clean professional color grading
`,

    pastel: `
soft premium pastel colors,
gentle highlights,
subtle shadows,
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

    const originalUserIdea =
        userPrompt?.trim() || title.trim();

    const textInstruction = textOverlay?.trim()
        ? `
The user wants this text added later:

"${textOverlay.trim()}"

DO NOT generate this text inside the image.

Instead, create clean negative space where the frontend can place
the text without covering the main subject.
`
        : `
Do not generate any text inside the image.
Leave useful negative space for optional typography.
`;

    const groqPrompt = `
You are an expert AI image prompt engineer and professional YouTube
thumbnail creative director.

Your MOST IMPORTANT responsibility is ACCURACY.

The final image must represent the user's original idea.
Do NOT replace, reinterpret, or change the user's main concept.

==================================================
ORIGINAL USER IDEA
==================================================

${originalUserIdea}

==================================================
VIDEO TITLE
==================================================

${title.trim()}

==================================================
SELECTED STYLE
==================================================

${selectedStyle}

==================================================
SELECTED COLOR PALETTE
==================================================

${selectedColor}

==================================================
ASPECT RATIO
==================================================

${aspectRatio || '16:9'}

==================================================
TEXT
==================================================

${textInstruction}

==================================================
STRICT ACCURACY RULES
==================================================

1. Preserve the user's main subject exactly.

2. Preserve every important object explicitly mentioned by
   the user.

3. NEVER replace one object with another object.

4. NEVER change the technology, product, person, animal,
   vehicle, place, programming language, device or concept
   requested by the user.

5. NEVER introduce unrelated subjects.

6. NEVER add random people or characters.

7. NEVER add random logos.

8. NEVER add unrelated technology.

9. NEVER add unrelated programming languages.

10. NEVER add random buildings, vehicles, animals or objects.

11. If the user requests a specific object, make that object
    clearly visible and recognizable.

12. If the user requests multiple objects, all important
    objects must be visible and visually understandable.

13. Style must support the user's idea.
    Style must NEVER override the user's idea.

14. Color palette must support the subject.
    Do not allow colors to hide or distort the main subject.

15. Do not make the background more visually important
    than the requested subject.

==================================================
COMPOSITION
==================================================

Create a professional YouTube thumbnail composition.

The main subject should be immediately recognizable.

Use:

- strong visual hierarchy
- large primary subject
- clear focal point
- foreground/background separation
- cinematic depth
- controlled background
- professional lighting
- dynamic camera angle when appropriate
- clean composition
- strong contrast
- balanced negative space
- premium commercial composition

The main subject should receive approximately
40-60% of the viewer's visual attention.

The background should SUPPORT the subject,
not compete with it.

==================================================
VISUAL QUALITY
==================================================

Ultra-detailed,
high-resolution,
4K-quality appearance,
premium commercial artwork,
cinematic lighting,
realistic materials,
sharp details,
professional depth of field,
beautiful highlights,
controlled shadows,
professional color grading,
high-end advertising quality,
polished expensive visual appearance.

==================================================
STRICTLY FORBIDDEN
==================================================

random text,
gibberish text,
watermark,
signature,
website name,
unrelated logo,
unrelated technology,
unrelated object,
extra character,
extra person,
extra animal,
extra vehicle,
duplicate objects,
clutter,
confusing composition,
distorted main subject,
generic stock-photo composition.

==================================================
FINAL REQUIREMENT
==================================================

Return ONE highly detailed image-generation prompt.

The prompt must preserve the original user's idea.

Do not explain anything.

Do not add headings.

Do not mention these instructions.

Return only the final image-generation prompt.
`;

    const completion = await ai.chat.completions.create({
        model: 'openai/gpt-oss-120b',

        messages: [
            {
                role: 'system',
                content:
                    'You are an extremely accurate image prompt engineer. Preserve the user concept exactly. Never invent unrelated visual elements.',
            },
            {
                role: 'user',
                content: groqPrompt,
            },
        ],

        /*
         * Lower temperature = less creative drift.
         */
        temperature: 0.25,

        max_tokens: 1400,
    });

    const generatedPrompt =
        completion.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
        return `
${originalUserIdea}

${selectedStyle}

${selectedColor}

exact requested subject,
exact requested objects,
clear visual hierarchy,
large recognizable main subject,
cinematic composition,
professional YouTube thumbnail,
high-resolution,
sharp focus,
realistic lighting,
premium commercial quality,
clean background,
no text,
no watermark,
no unrelated objects
`;
    }

    return generatedPrompt;
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
IMPORTANT:
Follow the user's requested concept exactly.

Do not reinterpret the concept.

Do not replace requested objects.

Do not invent unrelated subjects.

==================================================
IMAGE GENERATION PROMPT
==================================================

${prompt}

==================================================
ACCURACY REQUIREMENTS
==================================================

- Preserve the main subject exactly.
- Preserve every explicitly requested object.
- Make requested objects clearly visible.
- Do not replace requested objects.
- Do not add unrelated objects.
- Do not add random people.
- Do not add random characters.
- Do not add unrelated technology.
- Do not add unrelated programming languages.
- Do not add unrelated logos.
- Do not change the meaning of the concept.
- Keep the background subordinate to the main subject.

==================================================
COMPOSITION
==================================================

Large recognizable main subject,
clear visual hierarchy,
strong focal point,
professional YouTube thumbnail composition,
controlled background,
cinematic depth,
strong subject separation,
dynamic but clean composition,
professional commercial artwork.

==================================================
QUALITY
==================================================

Ultra-detailed,
high-resolution,
4K-quality appearance,
sharp focus,
realistic textures,
cinematic commercial lighting,
professional depth of field,
premium color grading,
high contrast,
beautiful highlights,
controlled shadows,
polished expensive appearance.

==================================================
TEXT RESTRICTION
==================================================

Do NOT generate text.

Do NOT generate letters.

Do NOT generate random typography.

Do NOT generate gibberish.

Leave clean negative space for text overlay.

==================================================
NEGATIVE ELEMENTS
==================================================

random text,
gibberish,
watermark,
signature,
website,
unrelated objects,
extra people,
extra characters,
extra animals,
extra vehicles,
duplicate objects,
random logos,
unrelated technology,
cluttered background,
distorted objects,
confusing composition.
`;

    const encodedPrompt = encodeURIComponent(finalPrompt);

    /*
     * GPT Image 2 is available in the current Pollinations
     * image-model catalog.
     */
    const imageUrl =
        `https://image.pollinations.ai/prompt/${encodedPrompt}` +
        `?width=${width}` +
        `&height=${height}` +
        `&nologo=true` +
        `&enhance=true` +
        `&model=gpt-image-2`;

    console.log('========================================');
    console.log('POLLINATIONS IMAGE GENERATION');
    console.log('========================================');
    console.log(`Model: gpt-image-2`);
    console.log(`Aspect ratio: ${aspectRatio}`);
    console.log(`Dimensions: ${width}x${height}`);

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

        /* ---------------------------------------------
           VALIDATE TITLE
        --------------------------------------------- */

        if (
            !title ||
            typeof title !== 'string' ||
            !title.trim()
        ) {
            return res.status(400).json({
                message: 'Thumbnail title is required.',
            });
        }

        /* ---------------------------------------------
           DEFAULT VALUES
        --------------------------------------------- */

        const selectedAspectRatio =
            aspect_ratio || '16:9';

        const selectedStyle =
            style || 'Bold & Graphic';

        const selectedColorScheme =
            color_scheme || 'vibrant';

        const selectedUserPrompt =
            typeof user_prompt === 'string'
                ? user_prompt.trim()
                : '';

        const selectedTextOverlay =
            typeof text_overlay === 'string'
                ? text_overlay.trim()
                : '';

        /* ---------------------------------------------
           CREATE DATABASE RECORD
        --------------------------------------------- */

        thumbnail = await Thumbnail.create({
            userId,

            title: title.trim(),

            prompt_used: selectedUserPrompt,

            user_prompt: selectedUserPrompt,

            style: selectedStyle,

            aspect_ratio: selectedAspectRatio,

            color_scheme: selectedColorScheme,

            text_overlay: selectedTextOverlay,

            isGenerating: true,
        });

        console.log('========================================');
        console.log('THUMBNAIL GENERATION STARTED');
        console.log('========================================');

        console.log('Title:', title.trim());
        console.log(
            'User prompt:',
            selectedUserPrompt || 'Not provided'
        );
        console.log('Style:', selectedStyle);
        console.log(
            'Aspect ratio:',
            selectedAspectRatio
        );
        console.log(
            'Color scheme:',
            selectedColorScheme
        );

        /* ---------------------------------------------
           STEP 1 — GROQ PROMPT ENHANCEMENT
        --------------------------------------------- */

        console.log(
            'Step 1: Enhancing prompt using Groq...'
        );

        const enhancedPrompt =
            await enhancePromptWithGroq({
                title: title.trim(),

                userPrompt:
                    selectedUserPrompt || title.trim(),

                style: selectedStyle,

                colorScheme:
                    selectedColorScheme,

                aspectRatio:
                    selectedAspectRatio,

                textOverlay:
                    selectedTextOverlay,
            });

        console.log(
            'Step 2: Groq prompt generated successfully.'
        );

        console.log(
            'Enhanced prompt length:',
            enhancedPrompt.length
        );

        /* ---------------------------------------------
           STEP 2 — IMAGE GENERATION
        --------------------------------------------- */

        console.log(
            'Step 3: Generating accurate image with Pollinations AI...'
        );

        const finalBuffer =
            await generateImageWithPollinations(
                enhancedPrompt,
                selectedAspectRatio
            );

        if (
            !finalBuffer ||
            finalBuffer.length === 0
        ) {
            throw new Error(
                'Image generation returned an empty image.'
            );
        }

        console.log(
            'Step 4: Image generated successfully.'
        );

        console.log(
            'Generated image size:',
            finalBuffer.length,
            'bytes'
        );

        /* ---------------------------------------------
           STEP 3 — CLOUDINARY UPLOAD
        --------------------------------------------- */

        console.log(
            'Step 5: Uploading image to Cloudinary...'
        );

        const base64Image =
            `data:image/png;base64,${finalBuffer.toString(
                'base64'
            )}`;

        const uploadResult =
            await cloudinary.uploader.upload(
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

        console.log(
            'Step 6: Cloudinary upload successful.'
        );

        /* ---------------------------------------------
           SAVE FINAL THUMBNAIL DATA
        --------------------------------------------- */

        thumbnail.image_url =
            uploadResult.secure_url;

        thumbnail.prompt_used =
            enhancedPrompt;

        thumbnail.isGenerating = false;

        await thumbnail.save();

        console.log('========================================');
        console.log(
            'THUMBNAIL GENERATED SUCCESSFULLY'
        );
        console.log('========================================');

        return res.status(200).json({
            message:
                'Thumbnail Generated Successfully',

            thumbnail,
        });

    } catch (error: any) {
        console.error('========================================');
        console.error(
            'THUMBNAIL GENERATION ERROR'
        );
        console.error('========================================');

        console.error(error);

        /* ---------------------------------------------
           UPDATE FAILED GENERATION
        --------------------------------------------- */

        if (thumbnail) {
            try {
                thumbnail.isGenerating = false;

                await thumbnail.save();
            } catch (saveError) {
                console.error(
                    'Failed to update thumbnail status:',
                    saveError
                );
            }
        }

        /* ---------------------------------------------
           ERROR MESSAGE
        --------------------------------------------- */

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

        /* ---------------------------------------------
           AUTHENTICATION
        --------------------------------------------- */

        if (!userId) {
            return res.status(401).json({
                message:
                    'Unauthorized. Please login again.',
            });
        }

        /* ---------------------------------------------
           DELETE ONLY USER'S OWN THUMBNAIL
        --------------------------------------------- */

        const deletedThumbnail =
            await Thumbnail.findOneAndDelete({
                _id: id,
                userId,
            });

        if (!deletedThumbnail) {
            return res.status(404).json({
                message: 'Thumbnail not found.',
            });
        }

        return res.status(200).json({
            message:
                'Thumbnail deleted successfully',
        });

    } catch (error: any) {
        console.error(
            'Delete thumbnail error:',
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                'Failed to delete thumbnail.',
        });
    }
};