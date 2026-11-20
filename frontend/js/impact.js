
// ==========================================
// ReUseLoop - Impact Dashboard
// ==========================================

const API_URL = "http://127.0.0.1:8000";

async function loadImpactData() {
    const message = document.getElementById("impact-message");

    try {
        const response = await fetch(`${API_URL}/items`);

        if (!response.ok) {
            throw new Error("Could not retrieve item listings.");
        }

        const items = await response.json();

        const totalItems = items.length;

        const donationItems = items.filter(item =>
            String(item.listing_type || "").toLowerCase().includes("donat")
        ).length;

        const exchangeItems = items.filter(item =>
            String(item.listing_type || "").toLowerCase().includes("exchang")
        ).length;

        // Illustrative points only; not measured environmental savings.
        const impactPoints = totalItems * 10;

        document.getElementById("items-reused").textContent = totalItems;
        document.getElementById("donations-count").textContent = donationItems;
        document.getElementById("exchange-count").textContent = exchangeItems;
        document.getElementById("estimated-impact").textContent = impactPoints;

        const reusePercent = totalItems > 0 ? 100 : 0;
        const donationPercent = totalItems > 0
            ? Math.round((donationItems / totalItems) * 100)
            : 0;
        const exchangePercent = totalItems > 0
            ? Math.round((exchangeItems / totalItems) * 100)
            : 0;

        document.getElementById("reuse-percentage").textContent =
            `${reusePercent}%`;
        document.getElementById("donation-percentage").textContent =
            `${donationPercent}%`;
        document.getElementById("exchange-percentage").textContent =
            `${exchangePercent}%`;

        document.getElementById("reuse-progress").style.width =
            `${reusePercent}%`;
        document.getElementById("donation-progress").style.width =
            `${donationPercent}%`;
        document.getElementById("exchange-progress").style.width =
            `${exchangePercent}%`;

        message.textContent = "Dashboard updated successfully.";
        message.style.color = "#15803d";

    } catch (error) {
        console.error("Impact dashboard error:", error);

        message.textContent =
            "Unable to load live statistics. Make sure the ReUseLoop backend is running.";
        message.style.color = "#b91c1c";
    }
}

document.addEventListener("DOMContentLoaded", loadImpactData);

