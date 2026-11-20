const API_URL = "http://127.0.0.1:8000";

const container = document.getElementById("donations-container");
const message = document.getElementById("donations-message");
const searchForm = document.getElementById("donations-search-form");
const searchInput = document.getElementById("donations-search-input");

async function loadDonations(keyword = "") {
container.replaceChildren();
message.textContent = "Loading donations...";


try {
    let url = `${API_URL}/items`;

    if (keyword.trim()) {
        url = `${API_URL}/items/search?q=${encodeURIComponent(keyword.trim())}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    const items = await response.json();

    const donations = items.filter(item =>
        String(item.listing_type).toLowerCase() === "donation" &&
        String(item.status).toLowerCase() === "available"
    );

    displayDonations(donations);

} catch (error) {
    console.error("Donations error:", error);
    message.textContent =
        "Unable to load donations. Check that the backend is running.";
}

}

function displayDonations(items) {
container.replaceChildren();

if (items.length === 0) {
    message.textContent =
        "No donations are available yet. You can be the first to donate!";

    return;
}

message.textContent = `${items.length} donation(s) available.`;

items.forEach(item => {
    const card = document.createElement("article");
    card.className = "donation-card";

    if (item.image_url) {
        const image = document.createElement("img");

        image.src = item.image_url.startsWith("http")
            ? item.image_url
            : `${API_URL}${item.image_url}`;

        image.alt = item.title || "Donated item";

        image.onerror = () => image.remove();

        card.appendChild(image);
    }

    const label = document.createElement("span");
    label.className = "donation-label";
    label.textContent = "Free Donation";

    const title = document.createElement("h3");
    title.textContent = item.title || "Untitled item";

    const description = document.createElement("p");
    description.textContent =
        item.description || "No description available.";

    const condition = document.createElement("p");
    condition.textContent =
        `Condition: ${item.item_condition || "Not specified"}`;

    const city = document.createElement("p");
    city.textContent = `Location: ${item.city || "Not specified"}`;

    const details = document.createElement("a");
    details.className = "donation-button";
    details.href =
        `../item-details.html?id=${encodeURIComponent(item.item_id)}`;
    details.textContent = "View Details";

    card.append(label, title, description, condition, city, details);
    container.appendChild(card);
});

}

searchForm.addEventListener("submit", event => {
event.preventDefault();
loadDonations(searchInput.value);
});

loadDonations();
