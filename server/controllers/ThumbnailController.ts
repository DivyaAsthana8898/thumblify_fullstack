import { Request, Response } from 'express';
import axios from 'axios';
import Thumbnail from '../models/Thumbnail.js';
import ai from '../configs/ai.js';
import cloudinary from '../configs/cloudinary.js';

/* =========================================================
   PREMIUM THUMBNAIL STYLE PROMPTS
========================================================= */

const stylePrompts = {
    'Bold & Graphic': `
premium viral YouTube thumbnail design,
bold visual storytelling,
strong focal point,
dramatic subject,
vibrant controlled colors,
powerful contrast,
dynamic composition,
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

/* =========================================================
   PREMIUM COLOR SCHEMES
========================================================= */

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

/* =========================================================
   SAFE BOOLEAN CONVERTER
========================================================= */

const normalizeBoolean = (
    value: unknown,
    defaultValue = false
): boolean => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (
            normalized === '' ||
            normalized === 'false' ||
            normalized === '0' ||
            normalized === 'no' ||
            normalized === 'null' ||
            normalized === 'undefined'
        ) {
            return false;
        }

        if (
            normalized === 'true' ||
            normalized === '1' ||
            normalized === 'yes'
        ) {
            return true;
        }
    }

    if (typeof value === 'number') {
        return value === 1;
    }

    return defaultValue;
};

/* =========================================================
   ENHANCE USER PROMPT USING GROQ
========================================================= */

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
    textOverlay?: boolean;
}) => {
    const selectedStyle =
        stylePrompts[style as ThumbnailStyle] ||
        stylePrompts['Bold & Graphic'];

    const selectedColor =
        colorSchemeDescriptions[colorScheme as ColorScheme] ||
        colorSchemeDescriptions.vibrant;

    const originalUserIdea =
        userPrompt?.trim() || title.trim();

    const textInstruction = textOverlay
        ? `
TEXT OVERLAY IS ENABLED.

Do NOT generate actual readable text inside the image.

Instead:
- leave clean negative space
- keep the main subject away from that area
- create enough visual contrast for text to be added later
`
        : `
TEXT OVERLAY IS DISABLED.

Do not generate any text,
letters,
words,
typography,
logos,
watermarks,
or random characters inside the image.
`;

    const groqPrompt = `
You are a world-class AI image prompt engineer,
professional YouTube thumbnail designer,
cinematic art director,
and commercial advertising creative director.

Your highest priority is ACCURACY.

The final image MUST represent the user's original idea.

Do NOT change the user's concept.
Do NOT replace the main subject.
Do NOT invent unrelated objects.

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
SELECTED COLOR SCHEME
==================================================

${selectedColor}

==================================================
ASPECT RATIO
==================================================

${aspectRatio || '16:9'}

==================================================
TEXT OVERLAY
==================================================

${textInstruction}

==================================================
STRICT CONCEPT PRESERVATION
==================================================

The user's idea has the highest priority.

The style is secondary.

The color scheme is secondary.

The visual concept must remain faithful to the user's idea.

RULES:

1. Preserve the exact main subject.

2. Preserve every important object explicitly mentioned
   by the user.

3. If the user mentions a specific person,
   represent that person or requested type of person.

4. If the user mentions a specific technology,
   preserve that technology.

5. If the user mentions a programming language,
   preserve that programming language.

6. If the user mentions a product,
   preserve that product.

7. If the user mentions a device,
   preserve that device.

8. If the user mentions an animal,
   preserve that animal.

9. If the user mentions a vehicle,
   preserve that vehicle.

10. If the user mentions a location,
    preserve the requested environment.

11. NEVER replace requested objects.

12. NEVER invent unrelated characters.

13. NEVER add random people.

14. NEVER add random animals.

15. NEVER add random vehicles.

16. NEVER add unrelated buildings.

17. NEVER add unrelated technology.

18. NEVER add unrelated programming languages.

19. NEVER add unrelated products.

20. NEVER add unrelated logos.

21. NEVER add unnecessary objects just to make
    the image look more detailed.

22. The background must support the subject.

23. The background must never overpower the subject.

24. The thumbnail must communicate the user's idea
    immediately.

==================================================
COMPOSITION
==================================================

Create a professional YouTube thumbnail.

The main subject must be:

- large
- clear
- recognizable
- visually dominant
- sharply focused

Use:

- strong visual hierarchy
- clear focal point
- foreground separation
- middle-ground separation
- background separation
- cinematic depth
- professional lighting
- controlled perspective
- strong contrast
- balanced negative space
- premium commercial composition

Avoid generic stock-photo composition.

Avoid boring centered compositions unless
the concept specifically requires it.

==================================================
VISUAL QUALITY
==================================================

Ultra-detailed,
high-resolution,
4K-quality appearance,
premium commercial artwork,
cinematic lighting,
realistic textures,
sharp details,
professional depth of field,
beautiful highlights,
controlled shadows,
strong contrast,
professional color grading,
high-end advertising quality,
polished expensive appearance.

==================================================
FORBIDDEN
==================================================

random text,
gibberish,
watermark,
signature,
website name,
random logo,
unrelated logo,
unrelated object,
extra character,
extra person,
extra animal,
extra vehicle,
duplicate objects,
clutter,
confusing composition,
distorted main subject,
bad anatomy,
unnecessary background elements.

==================================================
FINAL OUTPUT
==================================================

Return ONE extremely detailed image-generation prompt.

The prompt must preserve the user's original concept.

Do not explain anything.

Do not add headings.

Do not mention these instructions.

Return ONLY the final image-generation prompt.
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

        temperature: 0.25,

        max_tokens: 1400,
    });

    const generatedPrompt =
        completion.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
        return `
${originalUserIdea},

${selectedStyle},

${selectedColor},

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

/* =========================================================
   GENERATE IMAGE USING POLLINATIONS AI
========================================================= */

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
IMPORTANT IMAGE GENERATION RULES:

Follow the user's requested concept exactly.

Do not reinterpret the concept.

Do not replace requested objects.

Do not invent unrelated subjects.

==================================================
IMAGE PROMPT
==================================================

${prompt}

==================================================
CONCEPT ACCURACY
==================================================

Preserve the exact main subject.

Preserve every explicitly requested object.

Make requested objects clearly visible.

Do not replace requested objects.

Do not add unrelated objects.

Do not add random people.

Do not add random characters.

Do not add random animals.

Do not add random vehicles.

Do not add unrelated technology.

Do not add unrelated programming languages.

Do not add unrelated products.

Do not add unrelated logos.

Do not change the meaning of the concept.

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

The main subject must be more visually important
than the background.

==================================================
IMAGE QUALITY
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
TEXT
==================================================

Do not generate text.

Do not generate letters.

Do not generate words.

Do not generate random typography.

Do not generate gibberish.

Do not generate watermarks.

Do not generate signatures.

Do not generate website names.

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

    const encodedPrompt =
        encodeURIComponent(finalPrompt);

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

    console.log(
        'Model: gpt-image-2'
    );

    console.log(
        'Aspect Ratio:',
        aspectRatio
    );

    console.log(
        'Dimensions:',
        `${width}x${height}`
    );

    const response = await axios.get(
        imageUrl,
        {
            responseType: 'arraybuffer',

            timeout: 180000,

            headers: {
                Accept: 'image/*',
            },
        }
    );

    if (
        !response.data ||
        response.data.length === 0
    ) {
        throw new Error(
            'Pollinations returned an empty image.'
        );
    }

    return Buffer.from(response.data);
};

/* =========================================================
   GENERATE THUMBNAIL CONTROLLER
========================================================= */

export const generateThumbnail = async (
    req: Request,
    res: Response
) => {
    let thumbnail: any = null;

    try {
        /* ---------------------------------------------
           AUTHENTICATION
        --------------------------------------------- */

        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({
                message:
                    'Unauthorized. Please login again.',
            });
        }

        /* ---------------------------------------------
           REQUEST DATA
        --------------------------------------------- */

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
                message:
                    'Thumbnail title is required.',
            });
        }

        /* ---------------------------------------------
           NORMALIZE DATA
        --------------------------------------------- */

        const selectedAspectRatio =
            typeof aspect_ratio === 'string' &&
            aspect_ratio.trim()
                ? aspect_ratio.trim()
                : '16:9';

        const selectedStyle =
            typeof style === 'string' &&
            style.trim()
                ? style.trim()
                : 'Bold & Graphic';

        const selectedColorScheme =
            typeof color_scheme === 'string' &&
            color_scheme.trim()
                ? color_scheme.trim()
                : 'vibrant';

        const selectedUserPrompt =
            typeof user_prompt === 'string'
                ? user_prompt.trim()
                : '';

        /*
         * IMPORTANT:
         *
         * Thumbnail schema expects Boolean.
         *
         * Therefore:
         * ""
         * "false"
         * false
         * undefined
         *
         * all become false.
         */

        const selectedTextOverlay =
            normalizeBoolean(
                text_overlay,
                false
            );

        console.log('========================================');
        console.log('THUMBNAIL REQUEST DATA');
        console.log('========================================');

        console.log(
            'Title:',
            title.trim()
        );

        console.log(
            'User Prompt:',
            selectedUserPrompt ||
                'Using title as concept'
        );

        console.log(
            'Style:',
            selectedStyle
        );

        console.log(
            'Aspect Ratio:',
            selectedAspectRatio
        );

        console.log(
            'Color Scheme:',
            selectedColorScheme
        );

        console.log(
            'Text Overlay:',
            selectedTextOverlay
        );

        /* ---------------------------------------------
           CREATE THUMBNAIL RECORD
        --------------------------------------------- */

        thumbnail = await Thumbnail.create({
            userId,

            title: title.trim(),

            prompt_used:
                selectedUserPrompt,

            user_prompt:
                selectedUserPrompt,

            style:
                selectedStyle,

            aspect_ratio:
                selectedAspectRatio,

            color_scheme:
                selectedColorScheme,

            /*
             * ALWAYS BOOLEAN
             */
            text_overlay:
                selectedTextOverlay,

            isGenerating: true,
        });

        console.log('========================================');
        console.log(
            'THUMBNAIL GENERATION STARTED'
        );
        console.log('========================================');

        /* ---------------------------------------------
           STEP 1 — GROQ
        --------------------------------------------- */

        console.log(
            'Step 1: Enhancing prompt using Groq...'
        );

        const enhancedPrompt =
            await enhancePromptWithGroq({
                title:
                    title.trim(),

                userPrompt:
                    selectedUserPrompt ||
                    title.trim(),

                style:
                    selectedStyle,

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
           STEP 2 — POLLINATIONS
        --------------------------------------------- */

        console.log(
            'Step 3: Generating image with Pollinations AI...'
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
            'Image size:',
            finalBuffer.length,
            'bytes'
        );

        /* ---------------------------------------------
           STEP 3 — CLOUDINARY
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

                    folder:
                        'thumblify/thumbnails',

                    transformation: [
                        {
                            quality:
                                'auto:best',

                            fetch_format:
                                'auto',
                        },
                    ],
                }
            );

        console.log(
            'Step 6: Cloudinary upload successful.'
        );

        /* ---------------------------------------------
           UPDATE THUMBNAIL
        --------------------------------------------- */

        thumbnail.image_url =
            uploadResult.secure_url;

        thumbnail.prompt_used =
            enhancedPrompt;

        thumbnail.isGenerating =
            false;

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

        console.error(
            error
        );

        /* ---------------------------------------------
           MARK GENERATION AS FAILED
        --------------------------------------------- */

        if (thumbnail) {
            try {
                thumbnail.isGenerating =
                    false;

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
            message:
                errorMessage,
        });
    }
};

/* =========================================================
   DELETE THUMBNAIL CONTROLLER
========================================================= */

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
           DELETE USER'S THUMBNAIL
        --------------------------------------------- */

        const deletedThumbnail =
            await Thumbnail.findOneAndDelete({
                _id: id,
                userId,
            });

        if (!deletedThumbnail) {
            return res.status(404).json({
                message:
                    'Thumbnail not found.',
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