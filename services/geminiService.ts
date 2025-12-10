import { GoogleGenAI } from "@google/genai";
import { ExecutionResult, FileSystem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const executeCode = async (code: string, language: string): Promise<ExecutionResult> => {
  if (!apiKey) return { output: "Error: API_KEY is missing.", error: true };

  try {
    const prompt = `
      You are a specialized code execution sandbox. 
      Language: ${language}.
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Simulate the execution of this code. 
      - If it is a script (Python, JS, C++), return the STDOUT.
      - If there are errors, return the STDERR.
      - Do NOT explain the code. Just output the result.
    `;

    // Keep Flash for speed in execution simulation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return { output: response.text || "", error: false };
  } catch (error: any) {
    return { output: `Execution Failed: ${error.message}`, error: true };
  }
};

export const chatWithAi = async (message: string, currentFileContent: string, allFiles: FileSystem): Promise<{ text: string, sources?: { title: string, uri: string }[] }> => {
  if (!apiKey) return { text: "Please configure your API Key." };

  // Create a lightweight context of the file system
  const fileContext = allFiles
    .filter(f => f.type === 'file')
    .map(f => `File: ${f.name}\n\`\`\`${f.language || 'text'}\n${f.content?.slice(0, 500)}${f.content && f.content.length > 500 ? '...' : ''}\n\`\`\``)
    .join('\n\n');

  try {
    const prompt = `
      You are an expert AI coding assistant in a cloud IDE.
      
      User Query: "${message}"
      
      Context (Currently Active File & Project Structure):
      ${currentFileContent ? `Active File:\n${currentFileContent}` : 'No active file'}
      
      Project Files Summary:
      ${fileContext}
      
      Provide a helpful, concise response. If asking to generate code, provide the code block.
      Use the googleSearch tool if the user asks about current events, documentation, or libraries that you might be outdated on.
    `;

    // Upgraded to Pro for complex chat interactions
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "I couldn't generate a response.";
    
    // Extract sources from grounding metadata
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || new URL(chunk.web.uri).hostname,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error(error);
    return { text: "Error communicating with AI Assistant." };
  }
};

export const generateFileContent = async (fileName: string, description: string, existingFiles: FileSystem): Promise<string> => {
  if (!apiKey) return "// Error: API Key is missing.";

  // Generate a tree-like structure of the project for context
  const projectStructure = existingFiles
    .map(f => `${f.type === 'folder' ? 'DIR ' : 'FILE'} ${f.parentId === 'root' ? '' : '.../'}${f.name}`)
    .join('\n');

  try {
    const prompt = `
      You are an expert code generator adding a file to an existing project.
      
      Current Project Structure:
      ${projectStructure}
      
      Task: Generate the content for a new file named "${fileName}".
      Description: "${description}".
      
      Rules:
      1. Return ONLY the valid code for this file.
      2. Do NOT wrap in markdown code blocks (e.g. no \`\`\`).
      3. Do NOT include explanations or conversation.
      4. Ensure the code is complete, functional, and consistent with the project structure.
    `;

    // Upgraded to Pro for better coding capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    let text = response.text || "";
    // Robustly strip markdown code blocks if the model ignores the instruction
    text = text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');
    
    return text;
  } catch (error: any) {
    return `// Generation Failed: ${error.message}`;
  }
};

export const analyzeProject = async (files: FileSystem): Promise<string> => {
  if (!apiKey) return "Please configure your API Key.";

  // Include full content for analysis
  const projectContext = files
    .filter(f => f.type === 'file' && f.content)
    .map(f => `File: ${f.name}\n\`\`\`${f.language || 'text'}\n${f.content}\n\`\`\``)
    .join('\n\n');

  try {
    const prompt = `
      You are an expert software architect and debugger.
      Analyze the following project for errors, bugs, logical flaws, and security issues.
      
      Project Files:
      ${projectContext}
      
      Output Format:
      1. **Summary**: Brief overview of the project status.
      2. **Issues Found**: List of specific issues (file name, line number if possible, description).
      3. **Suggested Fixes**: Code snippets or instructions to fix the issues.
      
      If the project looks good, say so. Be concise but thorough.
    `;

    // Upgraded to Pro for deep analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    return `Analysis Failed: ${error.message}`;
  }
};

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "1:1"
        }
      }
    });
    
    // Extract image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
        }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed", error);
    return null;
  }
};
