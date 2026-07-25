"""
Source Credibility Scoring Module for Veritas Research.

Calculates a credibility score (0.0 to 1.0) for web sources based on:
1. Domain Authority & TLD Heuristics (gov/edu/org vs commercial vs blogs/forums)
2. Search Engine Relevance Score (from Tavily)
3. Content Richness & Structure (length, citations, quotes)
4. HTTPS Security & Domain Trust
"""

import re
from typing import Any, Dict
from urllib.parse import urlparse

# High trust domain patterns (score weight: 0.90 - 0.98)
HIGH_TRUST_DOMAINS = {
    "gov": 0.95,
    "edu": 0.92,
    "mil": 0.92,
    "org": 0.82,
    "arxiv.org": 0.96,
    "nature.com": 0.95,
    "sciencedirect.com": 0.95,
    "ncbi.nlm.nih.gov": 0.98,
    "ieee.org": 0.94,
    "reuters.com": 0.90,
    "apnews.com": 0.90,
    "bbc.com": 0.88,
    "bbc.co.uk": 0.88,
    "bloomberg.com": 0.87,
    "wikipedia.org": 0.85,
    "mit.edu": 0.96,
    "stanford.edu": 0.96,
    "harvard.edu": 0.96,
}

# Low trust / user-generated content domains (score weight: 0.35 - 0.50)
LOW_TRUST_DOMAINS = {
    "reddit.com": 0.40,
    "medium.com": 0.45,
    "quora.com": 0.35,
    "tumblr.com": 0.35,
    "substack.com": 0.50,
    "wordpress.com": 0.45,
    "blogspot.com": 0.40,
    "twitter.com": 0.40,
    "x.com": 0.40,
    "facebook.com": 0.35,
}


def extract_domain(url: str) -> str:
    """Extract clean domain hostname from URL."""
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""


def calculate_domain_score(domain: str) -> float:
    """Calculate base domain authority score (0.0 to 1.0)."""
    if not domain:
        return 0.50

    # Exact domain match
    if domain in HIGH_TRUST_DOMAINS:
        return HIGH_TRUST_DOMAINS[domain]
    if domain in LOW_TRUST_DOMAINS:
        return LOW_TRUST_DOMAINS[domain]

    # Check TLD suffix (.gov, .edu, .org, etc.)
    for key, score in HIGH_TRUST_DOMAINS.items():
        if domain.endswith("." + key) or domain == key:
            return score

    # General .com / .io / .net defaults
    if domain.endswith(".org"):
        return 0.80
    if domain.endswith(".edu") or domain.endswith(".ac.uk"):
        return 0.92
    if domain.endswith(".gov"):
        return 0.95

    return 0.68  # Standard baseline commercial domain


def calculate_content_richness(content: str) -> float:
    """Evaluate text richness based on length, statistics, and citations."""
    if not content:
        return 0.30

    score = 0.50

    # Length reward
    length = len(content)
    if length > 500:
        score += 0.15
    elif length > 250:
        score += 0.08

    # Presence of numerical data/statistics
    if re.search(r"\b\d+(\.\d+)?%|\$\d+|\b(19|20)\d{2}\b", content):
        score += 0.15

    # Quote or attribution indicators
    if re.search(r'["“].*?["”]|according to|stated|reported|published', content, re.IGNORECASE):
        score += 0.10

    return min(score, 1.0)


def score_source_credibility(source: Dict[str, Any]) -> float:
    """
    Calculate composite credibility score for a source item.

    Weighted formula:
    - 50% Domain Authority
    - 30% Tavily Relevance Score
    - 20% Content Richness
    """
    url = source.get("url", "")
    domain = extract_domain(url)
    domain_score = calculate_domain_score(domain)

    # Tavily relevance score (usually 0.0 to 1.0)
    raw_relevance = source.get("score")
    if raw_relevance is None:
        relevance_score = 0.70
    else:
        relevance_score = max(0.0, min(1.0, float(raw_relevance)))

    content = source.get("content", "")
    richness_score = calculate_content_richness(content)

    # HTTPS bonus
    https_bonus = 0.03 if url.startswith("https://") else 0.0

    final_score = (
        (domain_score * 0.50)
        + (relevance_score * 0.30)
        + (richness_score * 0.20)
        + https_bonus
    )

    return round(max(0.0, min(1.0, final_score)), 2)
