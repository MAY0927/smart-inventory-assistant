# STOW — Devpost Submission Copy

## Tagline

Know what you own. Buy only what you need.

## Short description

STOW is an AI-assisted personal inventory and purchase-decision tool that turns one product photo into a reviewable inventory record, detects similar items before another purchase, and keeps essentials visible through a restock queue.

## Inspiration

Imagine finding a yellow dress that feels perfect. You are ready to buy it, but you cannot remember everything already in your wardrobe. Later, at home, you discover an almost identical dress that you had forgotten about.

That familiar moment inspired STOW. The same problem extends beyond clothing: people forget what they own, buy duplicates, and notice that everyday essentials are empty only when they need them.

Most inventory apps answer only one question: “What do I have?” We wanted to connect that record to two more useful decisions: “Should I buy this?” and “What should I restock?”

## What it does

STOW connects four parts of the decision:

1. **Inventory** — add, edit, delete, search, and filter personal items.
2. **Quick Add with Gemini** — upload one product photo and receive structured English suggestions for the item name, category, color, style, material, purpose, and notes.
3. **Purchase Check** — compare a potential purchase against existing inventory and explain the closest match.
4. **Restock** — set a threshold for each item and see a focused queue when quantities need attention.

AI suggestions never bypass the user. Gemini only pre-fills the item form, and the user reviews every field before saving. The uploaded image is analyzed but not stored.

Purchase Check is also intentionally explainable. Its deterministic score uses category (30%), color (30%), style (15%), material (15%), and purpose (10%). STOW shows the closest item, the total score, every weighted contribution, and a clear recommendation such as **Skip this one**.

## How we built it

STOW runs as a three-service Docker Compose application:

- **React and Vite** provide the English editorial interface.
- **Python and FastAPI** provide REST endpoints, validation, Gemini integration, and recommendation logic.
- **PostgreSQL**, **SQLAlchemy**, and **Alembic** provide persistent data and versioned database migrations.
- **Google Gemini API** analyzes a single JPEG, PNG, or WebP image and returns schema-constrained JSON.
- **Pytest** verifies upload validation, CRUD behavior, purchase evaluation, and recommendation bands.

The Gemini API key remains on the backend as an environment variable. The public `.env.example` documents the required variable name but contains no real credential. Images are limited to 8 MB, validated before analysis, and not stored.

We developed STOW through feature branches, focused commits, pull requests, reviews, and merges. This created a visible history of the product growing from a Docker foundation into a tested full-stack application.

## Challenges we ran into

The first challenge was keeping purchase advice useful without making it feel arbitrary. A black-box percentage would be difficult to trust, so we built a deterministic similarity engine and exposed every weighted contribution.

Connecting the frontend, backend, and PostgreSQL database created another learning curve. We learned to coordinate request schemas, migrations, form state, and persistent records while keeping the project reproducible through Docker Compose.

The Gemini workflow introduced a different set of responsibilities. We had to validate uploads, request structured output, handle invalid responses and rate limits, keep the API key out of Git and frontend code, and ensure that AI suggestions never saved themselves automatically.

We also encountered practical collaboration problems: older Docker projects occupied ports, feature branches changed the same React and CSS files, and merge conflicts had to be resolved without losing either feature. Each issue became part of learning how real development workflows operate.

Finally, we redesigned the original interface after recognizing that the hackathon audience was international. The final interface is fully English and uses a restrained editorial system instead of a generic dashboard style.

## Accomplishments that we're proud of

- Built a working full-stack product instead of a static prototype
- Turned a single real product image into useful, reviewable inventory fields
- Kept Gemini credentials server-side and avoided storing uploaded images
- Connected inventory CRUD, search, filtering, purchase decisions, and restocking
- Created an explainable recommendation with a visible scoring breakdown
- Added per-item restock thresholds and quick stock updates
- Built a reproducible three-service Docker environment
- Completed a fully English product redesign for an international audience
- Passed all nine backend tests
- Maintained a meaningful Git history through branches, pull requests, reviews, and merges

## What we learned

We learned that responsible AI product design requires more than calling a model. The system must constrain the output, validate the input, protect credentials, communicate uncertainty, and leave the final decision with the user.

We learned that explainability is part of the interface. Showing why two products match makes a recommendation more actionable than presenting an unexplained score.

We also learned how architecture supports collaboration. Migrations, environment examples, Docker Compose, feature branches, pull requests, and automated tests allowed the project to grow in clear and reviewable stages.

Most importantly, we learned to test the product as a complete user journey. Improvements such as English copy, Quick Add, and the restock quick action came from using the application rather than evaluating individual files in isolation.

## What's next for STOW

- Add authentication and separate inventories for multiple users
- Add rate limiting and further production safeguards
- Expand categories, including a dedicated Beauty category
- Add usage history and predicted depletion dates
- Provide optional user-controlled image storage
- Add shopping-list integration
- Build a dedicated responsive mobile experience

## Built with

React, Vite, JavaScript, Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, Google Gemini API, HTTPX, Pytest, Docker, and Docker Compose.

## AI usage disclosure

Google Gemini is used inside the product to analyze a user-selected image and suggest structured inventory fields. AI tools also assisted with learning, brainstorming, debugging, UI copy refinement, and code review during development. All suggestions and code changes were reviewed, tested, and understood by the contributors.

## Suggested 3–5 minute demo flow

1. **Set the scene:** You find a yellow dress but cannot remember whether a similar one is already at home.
2. **Show Inventory:** Open STOW and show the items already recorded.
3. **Show Quick Add:** Upload one product photo, explain the Gemini suggestions, review the fields, and save the item.
4. **Show Purchase Check:** Describe the yellow dress and reveal the closest existing match, recommendation, and weighted score breakdown.
5. **Show Restock:** Open the queue, explain the per-item threshold, and use **+ Add one**.
6. **Explain the stack:** Briefly show React, FastAPI, PostgreSQL, Docker Compose, Gemini, and the nine passing tests.
7. **Close:** “STOW helps you remember what you own, avoid unnecessary purchases, and restock only what you actually need.”

## Submission links

- Source code: https://github.com/MAY0927/smart-inventory-assistant
- Live demo: Add the production URL after deployment
- Demo video: Add the public video URL before submitting
