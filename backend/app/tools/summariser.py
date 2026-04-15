from langchain.tools import tool
from langchain_openai import ChatOpenAI


def create_summariser_tool(llm: ChatOpenAI):

    @tool
    def summarise_content(content: str) -> str:
        """Summarise long text into the 5 most important facts or findings relevant to the research."""
        try:
            response = llm.invoke(
                f"Extract the 5 most important facts, findings, or data points from this content. "
                f"Be concise and factual:\n\n{content[:3000]}"
            )
            return response.content
        except Exception as e:
            return f"Summarisation failed: {str(e)}"

    return summarise_content
