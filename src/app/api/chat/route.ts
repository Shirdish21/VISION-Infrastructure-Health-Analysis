import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyDAHTweMVjSlZbyPbc9KD8Qd1tgwoycIds";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an AI assistant for a Smart City Infrastructure Monitoring System called VISION. 
You are an expert in urban infrastructure health monitoring, anomaly detection, and predictive maintenance.

Your role is to help administrators:
- Analyze infrastructure health scores and status
- Identify critical assets requiring immediate attention
- Detect overloaded or underutilized infrastructure
- Provide zone-based risk analysis
- Suggest maintenance priorities and actions
- Summarize alerts and anomalies
- Analyze utilization trends

Current Infrastructure Context:
${context ? JSON.stringify(context, null, 2) : "No specific context provided"}

Instructions:
- Provide clear, actionable insights based on the context
- If asked about specific data, use the context provided
- Format responses professionally
- Use bullet points when appropriate
- If context is missing, provide general guidance
- Always answer using infrastructure monitoring insights
- Prefer bullet points and highlight critical assets first`;

    const fullPrompt = `${systemPrompt}

User Question: ${message.trim()}

Assistant:`;


    console.log("Sending request to Gemini API...");
    console.log("API Key present:", !!GEMINI_API_KEY);
    console.log("API URL:", GEMINI_API_URL);

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
        }),
      }
    );

    console.log("Gemini API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error response:", errorData);
      
      let errorMessage = "Failed to get response from AI service";
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch (e) {
        // Keep default error message if parsing fails
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();

    let aiResponse: string | null = null;

    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];
      if (candidate.content?.parts?.[0]) {
        aiResponse = candidate.content.parts[0].text;
      }
    }

    if (!aiResponse) {
      return NextResponse.json(
        { error: "Invalid response format from AI service" },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error("Chat API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}