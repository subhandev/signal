from langchain.tools import tool
from tavily import TavilyClient
from app.config import settings


def create_search_tool():
    client = TavilyClient(api_key=settings.TAVILY_API_KEY)

    @tool
    def web_search(query: str) -> str:
        """Search the web for current information on a topic. Returns titles, URLs, and content snippets."""
        try:
            response = client.search(
                query=query,
                search_depth="basic",
                max_results=6,
                include_answer=True,
            )

            results = []
            if response.get("answer"):
                results.append(f"Quick Answer: {response['answer']}\n")

            for r in response.get("results", []):
                results.append(
                    f"Title: {r['title']}\n"
                    f"URL: {r['url']}\n"
                    f"Content: {r['content'][:500]}\n"
                )

            return "\n---\n".join(results) if results else "No results found."

        except Exception as e:
            return f"Search failed: {str(e)}"

    return web_search
