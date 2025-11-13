#!/usr/bin/env python3
"""
Legal RAG System with Groq API
Ultra-fast responses with proper Nepali formatting and strict context grounding
"""

import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from groq import Groq

class LegalRAGWithGroq:
    def __init__(self, base_dir: str = "D:/okil ai/ml"):
        self.base_dir = Path(base_dir)
        self.db_dir = self.base_dir / "embeddings" / "chroma_db_v2"
        
        # Load environment variables
        env_path = Path("D:/okil ai/.env")
        load_dotenv(env_path)
        
        # Get Groq API key
        self.groq_api_key = os.getenv("Groq_API_KEY")
        if not self.groq_api_key:
            raise ValueError("Groq_API_KEY not found in .env file")
        
        # Initialize Groq client
        self.client = Groq(api_key=self.groq_api_key)
        
        # Available models: 
        # - llama-3.3-70b-versatile (best quality, multilingual)
        # - llama-3.1-8b-instant (fast)
        # - mixtral-8x7b-32768 (good multilingual)
        # - gemma2-9b-it (fast, good for Nepali)
        self.model = "llama-3.3-70b-versatile"
        
        print("✓ Groq API configured successfully")
        print(f"  Model: {self.model}")
        
        # Embedding Model
        self.embedding_model_name = "intfloat/multilingual-e5-large"
        self.collection_name = "legal_corpus_v2"
        
        # Initialize ChromaDB client
        print(f"Connecting to ChromaDB at {self.db_dir}...")
        self.client_db = chromadb.PersistentClient(path=str(self.db_dir))
        
        # Load embedding function
        print(f"Loading embedding model: {self.embedding_model_name}...")
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=self.embedding_model_name,
            device="cpu"
        )
        
        # Get the collection
        try:
            self.collection = self.client_db.get_collection(
                name=self.collection_name,
                embedding_function=self.embedding_function
            )
            print(f"✓ Connected to collection '{self.collection_name}' with {self.collection.count()} documents.\n")
        except Exception as e:
            print(f"Error: Could not load collection. {e}")
            raise e

    def search(self, query: str, top_k: int = 6) -> List[Dict[str, Any]]:
        """Search for relevant legal text chunks."""
        print(f"🔍 Searching for: '{query}'")
        
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )
        
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'rank': i + 1,
                'id': results['ids'][0][i],
                'text': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i] if 'distances' in results else None
            })
        
        print(f"✓ Found {len(formatted_results)} relevant legal chunks.\n")
        return formatted_results

    def generate_system_prompt(self) -> str:
        """Generate system prompt that enforces strict context-only answers."""
        return """You are "वकिल" - an expert Nepali legal advisor AI assistant. You help users understand Nepali law by providing accurate, well-structured answers.

CRITICAL RULES (YOU MUST FOLLOW STRICTLY):

1. **Language**: Answer ONLY in NEPALI (नेपाली भाषा), even if the question is in English

2. **Source Grounding**: Use ONLY the legal context provided in the user message. DO NOT use your training data or general knowledge. If the context doesn't contain the answer, clearly state: "माफ गर्नुहोस्, दिइएको कानूनी सन्दर्भमा यस प्रश्नको पूर्ण जवाफ उपलब्ध छैन।"

3. **Citations**: For every important legal point, provide clear citations:
   - Format: "नेपालको संविधान, धारा ७६ अनुसार..."
   - Or: "नागरिक संहिता, २०७४, दफा १७ बमोजजम..."

4. **Professional Formatting**:
   - Start with a brief introduction
   - Use bullet points (•) or numbered lists (१., २., ३.)
   - Use relevant emojis for clarity: ⚖️ (law), 📋 (rules), ✅ (allowed), ❌ (prohibited), 📊 (process)
   - Use headers with ** ** for sections
   - End with "📚 सन्दर्भ:" section listing sources

5. **Structure Example**:
```
[Brief introduction answering the core question]

**मुख्य बुँदाहरू:**

१. **[Topic 1]:** 
   • [Point with citation]
   • [Point with citation]

२. **[Topic 2]:**
   • [Point with citation]

**प्रक्रिया:** [If applicable]
• [Step-by-step process]

📚 **सन्दर्भ:**
• नेपालको संविधान, धारा X
• [Other sources used]
```

6. **Accuracy**: Be precise and detailed. Don't generalize or assume.

Remember: Your credibility depends on ONLY using the provided legal context. Never hallucinate or add information not in the context."""

    def generate_user_prompt(self, query: str, retrieved_chunks: List[Dict[str, Any]], max_chunk_chars: int = 800) -> str:
        """Generate user prompt with query and legal context.
        
        Args:
            query: User's question
            retrieved_chunks: Retrieved legal chunks
            max_chunk_chars: Maximum characters per chunk (default: 800 to stay under token limits)
        """
        
        # Build the context from retrieved chunks
        context_parts = []
        for i, chunk in enumerate(retrieved_chunks, 1):
            citation_ref = chunk['metadata'].get('citation_reference', 'Unknown Source')
            section_type = chunk['metadata'].get('section_type_ne', '')
            section_num = chunk['metadata'].get('section_number', '')
            text = chunk['text']
            
            # Truncate text if too long
            if len(text) > max_chunk_chars:
                text = text[:max_chunk_chars] + "..."
            
            header = f"[सन्दर्भ {i}: {citation_ref}"
            if section_type and section_num:
                header += f", {section_type} {section_num}"
            header += "]"
            
            context_parts.append(f"{header}\n{text}")
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Construct the user message
        user_message = f"""**प्रयोगकर्ताको प्रश्न:**
{query}

**उपलब्ध कानूनी सन्दर्भ (यो मात्र प्रयोग गर्नुहोस्):**

{context}

---

कृपया माथिको कानूनी सन्दर्भको आधारमा प्रयोगकर्ताको प्रश्नको विस्तृत, संरचित र पेशेवर जवाफ नेपालीमा दिनुहोस्।"""
        
        return user_message

    def query_groq(self, system_prompt: str, user_prompt: str) -> str:
        """Send prompt to Groq and get streaming response."""
        
        print("🤖 Generating answer using Groq (ultra-fast)...")
        print("=" * 60)
        print("📖 जवाफ (वकिल):")
        print("=" * 60 + "\n")
        
        try:
            # Create chat completion with streaming
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Low temperature for factual accuracy
                max_tokens=2048,
                top_p=0.9,
                stream=True
            )
            
            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    print(content, end='', flush=True)
                    full_response += content
            
            print("\n\n" + "=" * 60)
            return full_response
                
        except Exception as e:
            error_msg = f"❌ Error with Groq API: {str(e)}"
            print(error_msg)
            return error_msg

    def is_greeting_or_general(self, query: str) -> tuple[bool, str]:
        """Check if query is a greeting or general question about the bot."""
        query_lower = query.lower().strip()
        
        # Common greetings in English and Nepali
        greetings = ['hi', 'hello', 'hey', 'नमस्ते', 'नमस्कार', 'हाय', 'हेलो']
        
        # Bot capability questions
        capability_keywords = [
            'what can you do', 'how can you help', 'who are you', 'what are you',
            'तपाई के गर्न सक्नुहुन्छ', 'तपाई को हो', 'तपाई के हो', 'मदत गर्न सक्नुहुन्छ',
            'help me', 'मलाई मदत गर्नुहोस्'
        ]
        
        # Check for simple greetings
        if query_lower in greetings or len(query.split()) <= 2 and any(g in query_lower for g in greetings):
            return True, """नमस्ते! 🙏

म **ओकिल AI** हुँ, तपाईंको नेपाली कानूनी सहयोगी। 

**म तपाईंलाई कसरी मदत गर्न सक्छु:**

• **संविधान सम्बन्धी प्रश्न**: मौलिक अधिकार, सरकारी संरचना, नागरिकता आदि
• **दीवानी संहिता**: सम्पत्ति, विवाह, उत्तराधिकार, ऋण आदि
• **जग्गा सम्बन्धी कानून**: जग्गा उपयोग, स्वामित्व, जग्गा कर आदि
• **सम्पत्ति कर**: सम्पत्ति कर नियम, दर र भुक्तानी प्रक्रिया
• **वित्तीय ऐन**: बजेट, कर, राजस्व सम्बन्धी नियमहरू

कृपया मलाई कानूनी प्रश्न सोध्नुहोस्। म तपाईंलाई सटीक र विश्वसनीय जवाफ दिन तयार छु। 💼⚖️"""
        
        # Check for capability questions
        if any(keyword in query_lower for keyword in capability_keywords):
            return True, """नमस्ते! 🙏

म **ओकिल AI** हुँ - नेपाली कानूनको विशेषज्ञ कृत्रिम बुद्धिमत्ता। 

**मेरा क्षमताहरू:**

**१. संविधान सम्बन्धी जानकारी:**
• मौलिक अधिकार र कर्तव्य
• सरकारी संरचना र शक्ति विभाजन
• नागरिकता र निर्वाचन प्रणाली

**२. दीवानी कानून:**
• विवाह, सम्बन्धविच्छेद र पारिवारिक मामिला
• सम्पत्ति र उत्तराधिकार
• ऋण, कर्जा र व्यापार सम्झौता

**३. जग्गा सम्बन्धी कानून:**
• जग्गा उपयोग र स्वामित्व
• जग्गा कर र दर्ता प्रक्रिया

**४. कर सम्बन्धी नियम:**
• सम्पत्ति कर, आयकर
• कर भुक्तानी प्रक्रिया

**५. वित्तीय ऐन र बजेट**

कृपया मलाई कानूनी प्रश्न सोध्नुहोस्। म तपाईंलाई सटीक, संरचित र प्रमाणित जानकारी प्रदान गर्नेछु। ⚖️"""
        
        return False, ""
    
    def is_off_topic(self, query: str) -> tuple[bool, str]:
        """Check if query is completely off-topic (non-legal)."""
        query_lower = query.lower().strip()
        
        # Non-legal topics
        off_topic_keywords = [
            'weather', 'मौसम', 'recipe', 'खाना पकाउने', 'cooking', 'sports', 'खेलकुद',
            'movie', 'film', 'चलचित्र', 'music', 'संगीत', 'game', 'खेल',
            'celebrity', 'प्रसिद्ध व्यक्ति', 'joke', 'मजाक', 'story', 'कथा',
            'math', 'गणित', 'science', 'विज्ञान', 'history', 'इतिहास',
            'geography', 'भूगोल', 'astronomy', 'खगोल', 'medicine', 'औषधि'
        ]
        
        # Check for off-topic keywords
        if any(keyword in query_lower for keyword in off_topic_keywords):
            return True, """माफ गर्नुहोस्! 🙏

म **ओकिल AI** - नेपाली कानूनी विशेषज्ञ हुँ। म केवल **कानून सम्बन्धी प्रश्नहरूको** जवाफ दिन सक्छु।

**कृपया मलाई यस्ता प्रश्न सोध्नुहोस्:**
• संविधान र मौलिक अधिकार
• दीवानी कानून (विवाह, सम्पत्ति, उत्तराधिकार)
• जग्गा उपयोग र जग्गा कर
• सम्पत्ति कर र वित्तीय ऐन
• नागरिकता र निर्वाचन

कानूनी सहयोगको लागि म तयार छु! ⚖️💼"""
        
        return False, ""

    def answer_question(self, query: str, top_k: int = 6) -> Dict[str, Any]:
        """Complete RAG pipeline: retrieve relevant chunks and generate answer."""
        
        # Step 0: Check for greetings or general questions
        is_greeting, greeting_response = self.is_greeting_or_general(query)
        if is_greeting:
            return {
                'query': query,
                'answer': greeting_response,
                'sources': []
            }
        
        # Step 0.5: Check for off-topic questions
        is_off_topic, off_topic_response = self.is_off_topic(query)
        if is_off_topic:
            return {
                'query': query,
                'answer': off_topic_response,
                'sources': []
            }
        
        # Step 1: Retrieve relevant chunks
        results = self.search(query, top_k=top_k)
        
        if not results:
            return {
                'query': query,
                'answer': 'माफ गर्नुहोस्, तपाईंको प्रश्नसँग सम्बन्धित कुनै जानकारी भेटिएन।',
                'sources': []
            }
        
        # Step 2: Generate prompts
        system_prompt = self.generate_system_prompt()
        user_prompt = self.generate_user_prompt(query, results)
        
        # Step 3: Get answer from Groq
        answer = self.query_groq(system_prompt, user_prompt)
        
        # Step 4: Display sources
        print(f"\n📚 प्रयोग गरिएका कानूनी स्रोतहरू ({len(results)} अंश):")
        print("-" * 60)
        for i, source in enumerate(results, 1):
            citation = source['metadata'].get('citation_reference', 'Unknown')
            section_type = source['metadata'].get('section_type_ne', '')
            section_num = source['metadata'].get('section_number', '')
            if section_type and section_num:
                print(f"   {i}. {citation} ({section_type} {section_num})")
            else:
                print(f"   {i}. {citation}")
        print()
        
        return {
            'query': query,
            'answer': answer,
            'sources': results,
            'system_prompt': system_prompt,
            'user_prompt': user_prompt
        }


def main():
    """Interactive Q&A session with Groq."""
    print("=" * 60)
    print("⚡ LEGAL RAG SYSTEM WITH GROQ API")
    print("=" * 60)
    print("✨ Ultra-fast responses (< 5 seconds)")
    print("✨ Cross-lingual: Ask in English, get Nepali answers")
    print("✨ Powered by: Llama 3.1 70B + ChromaDB")
    print("=" * 60 + "\n")
    
    try:
        # Initialize RAG system
        rag = LegalRAGWithGroq()
        
        print("💡 Example queries:")
        print("   • How is the prime minister elected in Nepal?")
        print("   • What are the fundamental rights?")
        print("   • जग्गा उपयोगको नियम के छ?")
        print("   • सम्पत्ति कर कसरी तिर्ने?")
        print("   • नागरिकताको प्रकार के के छन्?")
        print("   • राष्ट्रपतिको शक्ति र अधिकार के हुन्?")
        
        print(f"\n✅ Ready for questions! (Type 'quit' to exit)")
        print("=" * 60)
        
        while True:
            try:
                query = input("\n❓ Your question: ").strip()
                
                if query.lower() in ['quit', 'exit', 'q']:
                    print("\n👋 धन्यवाद! फेरि भेटौंला।")
                    break
                
                if not query:
                    continue
                
                # Get answer
                result = rag.answer_question(query, top_k=6)
                
            except KeyboardInterrupt:
                print("\n\n👋 धन्यवाद! Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")
                import traceback
                traceback.print_exc()
    
    except Exception as e:
        print(f"Failed to initialize system: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
