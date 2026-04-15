import httpx
from bs4 import BeautifulSoup
from langchain.tools import tool


def create_scraper_tool(max_scrapes: int = 4):
    scrape_count = {"n": 0}

    @tool
    def scrape_page(url: str) -> str:
        """Scrape and read the full text content of a web page. Use for detailed information from a specific URL."""
        if scrape_count["n"] >= max_scrapes:
            return f"Scrape limit reached ({max_scrapes} pages). Use existing information to complete the report."

        try:
            scrape_count["n"] += 1
            headers = {"User-Agent": "Mozilla/5.0 (compatible; SIGNALBot/1.0; research agent)"}

            with httpx.Client(timeout=10, follow_redirects=True) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            clean_text = "\n".join(lines)

            return clean_text[:4000] if len(clean_text) > 4000 else clean_text

        except Exception as e:
            return f"Failed to scrape {url}: {str(e)}"

    return scrape_page
