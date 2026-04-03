import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.post("/generate-quiz", async (req, res) => {
  const { topic, numQuestions } = req.body;

  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate ${numQuestions} UPSC Prelims MCQs on the subject: ${topic}.
Each question should have:
- 4 options
- Correct answer
- Explanation

Return output as valid JSON only in this format:

[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct Option",
    "explanation": "Explain why this is correct"
  }
]

Do not include any extra text outside the JSON.`
        }
      ],
      model: "llama-3.1-8b-instant",
    });

    let quiz;
    try {
      const text = completion.choices[0].message.content;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const jsonString = text.slice(jsonStart, jsonEnd);
      quiz = JSON.parse(jsonString);
    } catch (err) {
      console.error("Invalid AI JSON:", completion.choices[0].message.content);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    res.json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating quiz");
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});