exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { imageBase64, mimeType, prompt } = JSON.parse(event.body || "{}");

    if (!imageBase64 || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "imageBase64 and mimeType are required" }),
      };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Netlify" }),
      };
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 900,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || "고추 병해를 JSON으로 진단해줘." },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data.error?.message || "Claude error" })
      };
    }

    const text = data?.content?.find(c => c.type === "text")?.text || "";

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message || "Server error" })
    };
  }
};
