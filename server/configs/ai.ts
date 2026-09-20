import Groq from 'groq-sdk';

const ai = new Groq({
    apiKey: process.env.GROQ_API_KEY as string
});

export default ai;