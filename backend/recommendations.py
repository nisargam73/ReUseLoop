# ==========================================
# ReUseLoop - AI Item Recommendation Engine
# ==========================================

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def recommend_similar_items(target_item, all_items, limit=4):
    """
    Recommend items similar to the selected item.

    Uses TF-IDF to represent item descriptions as numerical
    vectors and cosine similarity to compare those vectors.
    """

    if not target_item or not all_items:
        return []

    # Exclude the selected item and unavailable listings.
    candidates = [
        item for item in all_items
        if item["item_id"] != target_item["item_id"]
        and item.get("status") == "Available"
    ]

    if not candidates:
        return []

    # Combine the title, description, category, and listing type.
    documents = []

    for item in candidates:
        text = " ".join([
            str(item.get("title", "")),
            str(item.get("description", "")),
            str(item.get("category_id", "")),
            str(item.get("listing_type", ""))
        ])

        documents.append(text)

    target_text = " ".join([
        str(target_item.get("title", "")),
        str(target_item.get("description", "")),
        str(target_item.get("category_id", "")),
        str(target_item.get("listing_type", ""))
    ])

    # Build TF-IDF vectors for the candidates and target item.
    vectorizer = TfidfVectorizer(stop_words="english")

    vectors = vectorizer.fit_transform(
        documents + [target_text]
    )

    # Compare the target item with every candidate.
    similarities = cosine_similarity(
        vectors[-1],
        vectors[:-1]
    ).flatten()

    ranked_items = []

    for index, score in enumerate(similarities):
        item = candidates[index].copy()
        item["similarity_score"] = round(float(score), 4)

        ranked_items.append(item)

    # Return the highest-scoring recommendations.
    ranked_items.sort(
        key=lambda item: item["similarity_score"],
        reverse=True
    )

    return ranked_items[:limit]