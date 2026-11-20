// =============================================
// ReUseLoop - Messaging and Item Enquiry System
// =============================================

const API_URL = "";

const params = new URLSearchParams(window.location.search);

const CURRENT_USER_ID = Number(
    params.get("user_id") ||
    localStorage.getItem("reuseloop_user_id") ||
    2
);

localStorage.setItem("reuseloop_user_id", CURRENT_USER_ID);

let conversations = [];
let activeConversation = null;
let activeItem = null;
let refreshTimer = null;
let lastMessageCount = -1;
let loadingChat = false;

const conversationList = document.getElementById("conversation-list");
const chatName = document.getElementById("chat-name");
const chatStatus = document.getElementById("chat-status");
const chatMessages = document.getElementById("chat-messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

const itemPopup = document.getElementById("item-enquiry-popup");
const openItemButton = document.getElementById("open-item-info");

// =============================================
// HELPER FUNCTIONS
// =============================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getInitials(name) {
    return String(name || "U")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString([], {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function getOtherUser(conversation) {
    return conversation.other_user_name || "ReUseLoop Member";
}

// Always use the email entered when listing the item.
function getSellerEmail() {
    return (
        activeItem?.contact_email ||
        activeItem?.owner_email ||
        ""
    ).trim();
}

// =============================================
// LOAD CONVERSATIONS
// =============================================

async function loadConversations() {

    try {

        const response = await fetch(
            `${API_URL}/messages/conversations/${CURRENT_USER_ID}`
        );

        if (!response.ok) {
            throw new Error("Could not load conversations.");
        }

        conversations = await response.json();

        renderConversations();

        const requestedItemId = params.get("item_id");

        // First, check whether the requested item has a conversation.
        if (requestedItemId) {

            const requestedConversation = conversations.find(c =>
                Number(c.item_id) === Number(requestedItemId)
            );

            if (requestedConversation) {

                await selectConversation(requestedConversation);
                return;
            }

            // No conversation exists for this item.
            // Do not display another item's details.
            activeConversation = null;
            activeItem = null;

            if (refreshTimer) {
                clearInterval(refreshTimer);
                refreshTimer = null;
            }

            chatName.textContent = "New Enquiry";
            chatStatus.textContent = "Item details";

            chatMessages.textContent =
                "No conversation yet. You can contact the seller using the enquiry details.";

            openItemButton.disabled = true;

            // Fetch the exact item from the URL.
            const itemResponse = await fetch(
                `${API_URL}/items/${requestedItemId}`
            );

            if (!itemResponse.ok) {
                throw new Error("Could not retrieve the requested item.");
            }

            const item = await itemResponse.json();

            activeItem = item;

            showItemPopup(item);

            return;
        }

        // No conversations and no requested item.
        if (!conversations.length) {

            activeConversation = null;
            activeItem = null;

            openItemButton.disabled = true;

            chatName.textContent = "No conversations";

            chatStatus.textContent =
                "Contact a seller to start an enquiry.";

            chatMessages.textContent =
                "Your conversations will appear here.";

            return;
        }

        // Preserve the previously selected conversation.
        if (activeConversation) {

            const updated = conversations.find(c =>
                Number(c.item_id) === Number(activeConversation.item_id) &&
                Number(c.buyer_id) === Number(activeConversation.buyer_id) &&
                Number(c.seller_id) === Number(activeConversation.seller_id)
            );

            if (updated) {

                activeConversation = updated;

                renderConversations();

                return;
            }
        }

        // Otherwise select the first available conversation.
        await selectConversation(conversations[0]);

    } catch (error) {

        console.error("Conversation loading error:", error);

        conversationList.textContent =
            "Unable to load conversations. Check the backend.";
    }
}
// =============================================
// DISPLAY CONVERSATION LIST
// =============================================

function renderConversations() {

    if (!conversations.length) {

        conversationList.innerHTML =
            '<p class="chat-empty">No conversations yet.</p>';

        return;
    }

    conversationList.innerHTML = conversations.map(c => {

        const selected =
            activeConversation &&
            Number(activeConversation.item_id) === Number(c.item_id) &&
            Number(activeConversation.buyer_id) === Number(c.buyer_id);

        const name = getOtherUser(c);

        return `
            <button
                class="conversation-item ${selected ? "active" : ""}"
                type="button"
                data-item-id="${Number(c.item_id)}"
                data-buyer-id="${Number(c.buyer_id)}">

                <div class="conversation-avatar">
                    ${escapeHTML(getInitials(name))}
                </div>

                <div class="conversation-info">

                    <strong>${escapeHTML(name)}</strong>

                    <span>${escapeHTML(c.title)}</span>

                    <small>${escapeHTML(c.city || "Location unavailable")}</small>

                </div>

            </button>
        `;

    }).join("");

    conversationList.querySelectorAll(".conversation-item")
        .forEach(button => {

            button.addEventListener("click", () => {

                const conversation = conversations.find(c =>
                    Number(c.item_id) === Number(button.dataset.itemId) &&
                    Number(c.buyer_id) === Number(button.dataset.buyerId)
                );

                if (conversation) {
                    selectConversation(conversation);
                }

            });

        });
}

// =============================================
// SELECT CONVERSATION
// =============================================

async function selectConversation(conversation) {

    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }

    activeConversation = conversation;
    activeItem = null;
    lastMessageCount = -1;

    renderConversations();

    chatName.textContent = getOtherUser(conversation);

    chatStatus.textContent =
        `${conversation.title} · ${conversation.city || ""}`;

    openItemButton.disabled = true;

    await loadItemDetails();

    await loadChat(true);

    refreshTimer = setInterval(() => {
        loadChat(false);
    }, 3000);
}

// =============================================
// FETCH ITEM DETAILS FROM FASTAPI
// =============================================

async function loadItemDetails() {

    if (!activeConversation) return;

    try {

        const response = await fetch(
            `${API_URL}/items/${activeConversation.item_id}`
        );

        if (!response.ok) {
            throw new Error("Unable to retrieve item details.");
        }

        const item = await response.json();

        activeItem = item;

        openItemButton.disabled = false;

        // Automatically display the popup when a conversation opens.
        showItemPopup(item);

    } catch (error) {

        console.error("Item details error:", error);

        activeItem = null;

        openItemButton.disabled = true;
    }
}

// =============================================
// SHOW ITEM DETAILS POPUP
// =============================================

function showItemPopup(item) {

    if (!item) return;

    document.getElementById("enquiry-item-name").textContent =
        item.title || "Not available";

    document.getElementById("enquiry-price").textContent =
        item.price == null
            ? "Not specified"
            : `₹${Number(item.price).toLocaleString("en-IN")}`;

    document.getElementById("enquiry-location").textContent =
        item.city || "Not available";

    // IMPORTANT: Use contact_email first.
    document.getElementById("enquiry-email").textContent =
        item.contact_email ||
        item.owner_email ||
        "Email unavailable";

    document.getElementById("enquiry-item-id").textContent =
        item.item_id;

    document.getElementById("enquiry-status").textContent = "";

    if (!itemPopup.open) {
        itemPopup.showModal();
    }
}

// =============================================
// CLOSE POPUP
// =============================================

document.getElementById("close-enquiry-popup")
    .addEventListener("click", () => {
        itemPopup.close();
    });

itemPopup.addEventListener("click", event => {

    if (event.target === itemPopup) {
        itemPopup.close();
    }

});

// =============================================
// OPEN ITEM DETAILS AGAIN
// =============================================

openItemButton.addEventListener("click", () => {

    if (activeItem) {
        showItemPopup(activeItem);
    }

});

// =============================================
// COPY SELLER EMAIL
// =============================================

document.getElementById("copy-seller-email")
    .addEventListener("click", async () => {

        const email = getSellerEmail();

        if (!email) {
            alert("Seller email is not available.");
            return;
        }

        try {

            await navigator.clipboard.writeText(email);

            document.getElementById("enquiry-status").textContent =
                "Seller email copied successfully!";

        } catch (error) {

            console.error(error);

            document.getElementById("enquiry-status").textContent =
                "Unable to copy email. Please copy it manually.";
        }
    });

// =============================================
// SEND EMAIL ENQUIRY
// =============================================

// =============================================
// SEND EMAIL ENQUIRY
// =============================================

const sendEnquiryButton = document.getElementById("send-enquiry");

sendEnquiryButton.addEventListener("click", async function (event) {
    event.preventDefault();

    if (!activeItem) {
        alert("Item details are not loaded. Please try again.");
        return;
    }

    const buyerId = Number(CURRENT_USER_ID);
    const sellerId = Number(activeItem.owner_id);

    if (!buyerId || !sellerId) {
        alert("Buyer or seller information is missing.");
        return;
    }

    if (buyerId === sellerId) {
        alert("You cannot send an enquiry for your own item.");
        return;
    }

    const messageText =
        `Hello, I am interested in your item "${activeItem.title}". ` +
        `Please let me know if it is available.\n\n` +
        `Price: ${activeItem.price == null ? "Not specified" : "₹" + Number(activeItem.price).toLocaleString("en-IN")}\n` +
        `Location: ${activeItem.city || "Not specified"}\n` +
        `Seller Email: ${activeItem.contact_email || activeItem.owner_email || "Not available"}`;

    try {
        const response = await fetch("/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                item_id: Number(activeItem.item_id),
                buyer_id: buyerId,
                sender_id: buyerId,
                message_text: messageText
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Unable to send enquiry.");
        }

        alert("Your enquiry has been sent successfully!");

        document.getElementById("enquiry-popup")?.classList.remove("show");

        // Open or refresh the conversation for this item.
        window.location.href =
            `messages.html?item_id=${activeItem.item_id}&user_id=${buyerId}`;

    } catch (error) {
        console.error("Send enquiry error:", error);
        alert(error.message || "Something went wrong while sending the enquiry.");
    }
});

// =============================================
// LOAD CHAT MESSAGES
// =============================================

async function loadChat(forceScroll = false) {

    if (!activeConversation || loadingChat) return;

    loadingChat = true;

    try {

        const response = await fetch(
            `${API_URL}/messages/${activeConversation.item_id}?user_id=${CURRENT_USER_ID}`
        );

        if (!response.ok) {
            throw new Error("Unable to load messages.");
        }

        const result = await response.json();

        const messages = result.messages || [];

        if (!forceScroll && messages.length === lastMessageCount) {
            return;
        }

        lastMessageCount = messages.length;

        chatMessages.replaceChildren();

        if (!messages.length) {

            chatMessages.textContent =
                "No messages yet. Start the conversation!";

            return;
        }

        messages.forEach(message => {

            const mine =
                Number(message.sender_id) === CURRENT_USER_ID;

            const bubble = document.createElement("div");

            bubble.className =
                `chat-bubble ${mine ? "sent" : "received"}`;

            const content = document.createElement("div");

            content.textContent = message.message_text;

            const time = document.createElement("small");

            time.className = "chat-time";

            time.textContent = formatTime(message.created_at);

            bubble.append(content, time);

            chatMessages.appendChild(bubble);

        });

        if (forceScroll) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

    } catch (error) {

        console.error(error);

        if (forceScroll) {
            chatMessages.textContent =
                "Unable to load this conversation.";
        }

    } finally {

        loadingChat = false;
    }
}

// =============================================
// SEND CHAT MESSAGE
// =============================================

messageForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!activeConversation) {
        alert("Select a conversation first.");
        return;
    }

    const messageText = messageInput.value.trim();

    if (!messageText) return;

    const sendButton =
        messageForm.querySelector("button[type='submit']");

    sendButton.disabled = true;

    try {

        const response = await fetch(`${API_URL}/messages`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                item_id: Number(activeConversation.item_id),

                buyer_id: Number(activeConversation.buyer_id),

                sender_id: CURRENT_USER_ID,

                message_text: messageText

            })

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || "Message could not be sent."
            );
        }

        messageInput.value = "";

        lastMessageCount = -1;

        await loadChat(true);

        await loadConversations();

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        sendButton.disabled = false;

        messageInput.focus();
    }

});

// =============================================
// CLEANUP
// =============================================

window.addEventListener("beforeunload", () => {

    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

});

// =============================================
// INITIALIZE
// =============================================

loadConversations();