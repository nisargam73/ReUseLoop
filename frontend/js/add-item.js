// =======================================
// ReUseLoop - Add Item and Photo Upload
// =======================================

const API_URL = "https://reuseloop.onrender.com";

const form = document.getElementById("add-item-form");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photo-preview");
const message = document.getElementById("form-message");
const submitButton = document.getElementById("submit-item");

let previewURL = null;


// =======================================
// 1. PREVIEW SELECTED PHOTO
// =======================================

photoInput.addEventListener("change", function () {

    const file = photoInput.files[0];

    if (previewURL) {
        URL.revokeObjectURL(previewURL);
        previewURL = null;
    }

    if (!file) {

        photoPreview.removeAttribute("src");
        photoPreview.style.display = "none";

        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        photoInput.value = "";

        photoPreview.removeAttribute("src");
        photoPreview.style.display = "none";

        message.textContent =
            "Choose a JPG, PNG, or WebP image.";

        message.style.color = "red";

        return;
    }

    if (file.size > 5 * 1024 * 1024) {

        photoInput.value = "";

        photoPreview.removeAttribute("src");
        photoPreview.style.display = "none";

        message.textContent =
            "Photo size must not exceed 5 MB.";

        message.style.color = "red";

        return;
    }

    previewURL = URL.createObjectURL(file);

    photoPreview.src = previewURL;
    photoPreview.alt = "Selected item photo";
    photoPreview.style.display = "block";

    message.textContent =
        "Photo selected successfully.";

    message.style.color = "green";
});


// =======================================
// 2. SUBMIT ITEM
// =======================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    message.textContent = "";

    const title =
        document.getElementById("title").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const categoryId =
        Number(document.getElementById("category_id").value);

    const itemCondition =
        document.getElementById("item_condition").value;

    const listingType =
        document.getElementById("listing_type").value;

    const city =
        document.getElementById("city").value.trim();

    const contactEmail =
        document.getElementById("contact_email").value.trim();

    const priceInput =
        document.getElementById("price").value.trim();

    const photo = photoInput.files[0];


    // =======================================
    // VALIDATION
    // =======================================

    if (
        !title ||
        !description ||
        !categoryId ||
        !itemCondition ||
        !listingType ||
        !city ||
        !contactEmail
    ) {

        message.textContent =
            "Please complete all required fields.";

        message.style.color = "red";

        return;
    }

    // Basic browser email validation

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(contactEmail)) {

        message.textContent =
            "Please enter a valid email address.";

        message.style.color = "red";

        return;
    }

    if (
        listingType === "Sale" &&
        priceInput === ""
    ) {

        message.textContent =
            "Enter a price for sale listings.";

        message.style.color = "red";

        return;
    }

    const price = listingType === "Sale"
        ? Number(priceInput)
        : null;

    if (
        listingType === "Sale" &&
        (!Number.isFinite(price) || price < 0)
    ) {

        message.textContent =
            "Enter a valid price.";

        message.style.color = "red";

        return;
    }


    // =======================================
    // PHOTO VALIDATION
    // =======================================

    if (photo) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(photo.type)) {

            message.textContent =
                "Choose a JPG, PNG, or WebP image.";

            message.style.color = "red";

            return;
        }

        if (photo.size > 5 * 1024 * 1024) {

            message.textContent =
                "Photo size must not exceed 5 MB.";

            message.style.color = "red";

            return;
        }
    }


    submitButton.disabled = true;

    try {

        // =======================================
        // STEP A: CREATE ITEM
        // =======================================

        message.textContent =
            "Creating your listing...";

        message.style.color = "blue";

        const itemData = {

            owner_id: 1,

            category_id: categoryId,

            title: title,

            description: description,

            item_condition: itemCondition,

            listing_type: listingType,

            price: price,

            city: city,

            // Seller email is sent inside the JSON body.
            contact_email: contactEmail
        };


        const createResponse = await fetch(
            `${API_URL}/items`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(itemData)
            }
        );


        const createResult =
            await createResponse.json();


        if (!createResponse.ok) {

    let errorMessage = "Could not create the item.";

    if (Array.isArray(createResult.detail)) {

        errorMessage = createResult.detail
            .map(err =>
                `${(err.loc || []).join(".")}: ${err.msg}`
            )
            .join("; ");

    } else if (typeof createResult.detail === "object"
               && createResult.detail !== null) {

        errorMessage = JSON.stringify(createResult.detail);

    } else if (createResult.detail) {

        errorMessage = createResult.detail;
    }

    throw new Error(errorMessage);
}


        const itemId = createResult.item_id;


        // =======================================
        // STEP B: UPLOAD PHOTO
        // =======================================

        if (photo) {

            message.textContent =
                "Listing created. Uploading your photo...";

            const photoData = new FormData();

            photoData.append("photo", photo);


            const photoResponse = await fetch(
                `${API_URL}/items/${itemId}/photo`,
                {
                    method: "POST",
                    body: photoData
                }
            );


            const photoResult =
                await photoResponse.json();


            if (!photoResponse.ok) {

                throw new Error(
                    `Listing created, but photo upload failed: ${
                        photoResult.detail ||
                        "Unknown error"
                    }. Your item ID is ${itemId}.`
                );
            }
        }


        // =======================================
        // STEP C: SUCCESS
        // =======================================

        message.textContent = photo
            ? "Success! Your item and photo have been uploaded."
            : "Success! Your item has been listed.";

        message.style.color = "green";


        form.reset();

        photoPreview.removeAttribute("src");

        photoPreview.style.display = "none";


        if (previewURL) {

            URL.revokeObjectURL(previewURL);

            previewURL = null;
        }


        // Open item details page

        setTimeout(function () {

            window.location.href =
                `item-details.html?id=${itemId}`;

        }, 1800);


    } catch (error) {

        console.error("Listing error:", error);

        message.textContent = error.message;

        message.style.color = "red";

    } finally {

        submitButton.disabled = false;
    }

});