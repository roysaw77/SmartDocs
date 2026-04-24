from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from litellm import completion

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
API_KEY = "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"
class RequestData(BaseModel):
    text: str

class GenerationData(BaseModel):
    text: str

@app.post("/summarize")
def summarize(data: RequestData):
    try:
        response = completion(
            model="nvidia_nim/meta/llama-3.1-8b-instruct",
            messages=[
                {"role": "user", "content": f"Summarize this:\n{data.text}"}
            ],
            api_key=API_KEY
        )

        result = response.choices[0].message.content
        return {"result": result}

    except Exception as e:
        print("ERROR:", e)  # ⭐ terminal 会看到
        return {"result": f"ERROR: {str(e)}"}  # ⭐ 前端也会看到

@app.post("/suggest")
def suggest(data: GenerationData):
    try:
       
        context = data.text[-200:]

        
        prompt = f"""
                    you are a helpful assistant that provides concise suggestions based on the given context.
                    Continue the sentence in 3 to 5 words only.
                    Do NOT explain.
                    Do NOT repeat the input.

                    Sentence:
                    {context}
                    """
        response = completion(
            model="nvidia_nim/meta/llama-3.1-8b-instruct",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=10,        
            temperature=0.3,     
            top_p=0.9,
            api_key=API_KEY
        )

        result = response.choices[0].message.content.strip()

        # ✅ 简单清洗（避免奇怪输出）
        if len(result.split()) > 6:
            result = " ".join(result.split()[:6])

        return {"result": result}

    except Exception as e:
        print("ERROR:", e)
        return {"result": ""}