# ReUseLoop

ReUseLoop is a student full-stack web application for listing second-hand items for sale, exchange, or donation. It includes item photo uploads, search and filters, an item similarity recommendation endpoint, repair-service sample listings, a browser-based message demo, a profile demo, and an impact dashboard.

## Technology

- Frontend: HTML, CSS, JavaScript
- Backend: Python, FastAPI
- Database: MySQL 8.x with SQLAlchemy and PyMySQL
- Recommendation engine: scikit-learn TF-IDF and cosine similarity

## Setup on Windows PowerShell

1. Install Python 3.11+ and MySQL 8.x.
2. Open PowerShell in the project folder.
3. Create and activate a virtual environment:

   ```powershell
   py -3.11 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

4. Install dependencies:

   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. Create the MySQL database and tables by running `sql/schema.sql` in MySQL Workbench or:

   ```powershell
   Get-Content .\sql\schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p
   ```

6. Copy `.env.example` to `.env` and enter your own local MySQL credentials:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

7. Start the app from the project root:

   ```powershell
   python -m uvicorn backend.main:app --reload
   ```

8. Open the website at `http://127.0.0.1:8000` and API documentation at `http://127.0.0.1:8000/docs`.

## Main pages

- Home: `/`
- Browse Items: `/pages/browse.html`
- Item Details: `/item-details.html?id=1`
- List an Item: `/add-item.html`
- Exchange Matcher: `/pages/exchange.html`
- Donations: `/pages/donations.html`
- Repair Directory: `/pages/repairs.html`
- Messages: `/pages/messages.html`
- Impact Dashboard: `/pages/impact.html`
- User Profile: `/pages/profile.html`

## Important project limitations

- The Add Item form currently uses a demo owner ID (`owner_id = 1`). There is no user registration or authentication system yet.
- Messages and profile data are demonstration features stored in the current browser's `localStorage`; they are not shared between users or saved in MySQL.
- Repair directory entries are sample data, not verified providers. The enquiry form opens the user's email application and does not send a message through the platform.
- Impact points are illustrative, not a verified carbon-emissions or waste-reduction calculation.
- Before deploying publicly, add authentication and authorization, validate image file contents (not only MIME type), add rate limiting, and secure listing deletion so only the owner can delete an item.

## Security

Do not commit or share `.env`. Keep database credentials in your local `.env` file only. `.env.example` contains placeholders.
