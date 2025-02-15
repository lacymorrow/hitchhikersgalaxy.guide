import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	dangerouslyAllowBrowser: true,
});

export interface Report {
	title: string;
	summary: string;
	sections: {
		title: string;
		content: string;
	}[];
	recommendations: string[];
	sources: string[];
}

export async function generateReport(topic: string): Promise<Report> {
	if (!topic.trim()) {
		throw new Error("Topic is required");
	}

	const systemPrompt = `You are an expert report generator capable of creating comprehensive, well-researched reports on any topic.

Your task is to generate a detailed, professional report that includes:
- A clear, descriptive title for the report
- An executive summary that outlines the key points
- Multiple relevant sections that dive deep into different aspects of the topic
- Actionable recommendations based on the analysis
- Citations from reliable sources to support the content

Format your response as a JSON object with:
{
  "title": "The main title of the report",
  "summary": "A concise executive summary",
  "sections": [
    {
      "title": "Section title",
      "content": "Detailed section content"
    }
  ],
  "recommendations": ["List of actionable recommendations"],
  "sources": ["List of citations and sources used"]
}

Guidelines:
1. Be thorough and analytical in your approach
2. Use clear, professional language
3. Support claims with evidence and citations
4. Provide specific, actionable recommendations
5. Organize information logically
6. Maintain objectivity and balance
7. Include relevant statistics and data when available`;

	const completion = await openai.chat.completions.create({
		model: "gpt-4-turbo-preview",
		messages: [
			{
				role: "system",
				content: systemPrompt,
			},
			{
				role: "user",
				content: topic,
			},
		],
		response_format: { type: "json_object" },
	});

	if (!completion.choices[0]?.message?.content) {
		throw new Error("Invalid response from OpenAI");
	}

	return JSON.parse(completion.choices[0].message.content);
}
