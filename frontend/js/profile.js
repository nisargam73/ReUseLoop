
// ==========================================
// ReUseLoop - User Profile
// ==========================================

const API_URL = "http://127.0.0.1:8000";
const PROFILE_KEY = "reuseloop_demo_profile";

const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const activityMessage = document.getElementById("activity-message");

const nameInput = document.getElementById("profile-name");
const emailInput = document.getElementById("profile-email");
const cityInput = document.getElementById("profile-city");
const bioInput = document.getElementById("profile-bio");

function loadProfile() {
    try {
        const savedProfile = localStorage.getItem(PROFILE_KEY);

        if (savedProfile) {
            const profile = JSON.parse(savedProfile);

            nameInput.value = profile.name || "";
            emailInput.value = profile.email || "";
            cityInput.value = profile.city || "";
            bioInput.value = profile.bio || "";
        }
    } catch (error) {
        console.error("Unable to load profile:", error);
        profileMessage.textContent = "Could not load saved profile details.";
    }

    updateProfileSummary();
}

function updateProfileSummary() {
    document.getElementById("summary-name").textContent =
        nameInput.value.trim() || "Your Name";

    document.getElementById("summary-email").textContent =
        emailInput.value.trim() || "your.email@example.com";

    document.getElementById("summary-city").textContent =
        cityInput.value.trim() || "Your city";
}

profileForm.addEventListener("submit", event => {
    event.preventDefault();

    const profile = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        city: cityInput.value.trim(),
        bio: bioInput.value.trim()
    };

    if (!profile.name || !profile.email) {
        profileMessage.textContent = "Please enter your name and email.";
        profileMessage.style.color = "#b91c1c";
        return;
    }

    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

        updateProfileSummary();

        profileMessage.textContent = "Profile saved successfully!";
        profileMessage.style.color = "#15803d";
    } catch (error) {
        console.error("Unable to save profile:", error);

        profileMessage.textContent =
            "Unable to save profile in this browser.";

        profileMessage.style.color = "#b91c1c";
    }
});

// Load platform listing counts.
async function loadActivity() {
    try {
        const response = await fetch(`${API_URL}/items`);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const items = await response.json();

        const donations = items.filter(item =>
            String(item.listing_type || "")
                .toLowerCase()
                .includes("donat")
        );

        const exchanges = items.filter(item =>
            String(item.listing_type || "")
                .toLowerCase()
                .includes("exchang")
        );

        document.getElementById("stat-listings").textContent =
            items.length;

        document.getElementById("stat-donations").textContent =
            donations.length;

        document.getElementById("stat-exchanges").textContent =
            exchanges.length;

        activityMessage.textContent = "Listing statistics updated.";
        activityMessage.style.color = "#15803d";
    } catch (error) {
        console.error("Unable to load activity:", error);

        activityMessage.textContent =
            "Could not load listings. Check that the backend is running.";

        activityMessage.style.color = "#b91c1c";
    }
}

loadProfile();
loadActivity();

