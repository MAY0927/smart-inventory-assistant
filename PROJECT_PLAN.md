# Smart Inventory Assistant — Project Plan

## 1. Project overview

Smart Inventory Assistant is a personal inventory and purchase-decision web application. It helps users remember what they already own, avoid duplicate purchases, and know when frequently used products may need to be replenished.

The core product flow is:

> What do I own? → Should I buy this? → When should I restock?

## 2. Problem

People often forget what they already own while shopping. This can lead to duplicate clothing, unnecessary spending, and expired or unused household products. Existing inventory applications mainly record items, but they rarely explain whether a new purchase is worthwhile based on the user's own inventory.

## 3. Target users

- Students and young adults who want to reduce unnecessary spending
- People who own many clothes, cosmetics, or household supplies
- Users who want simple inventory and restock reminders

## 4. MVP scope

### Inventory management

- Add, view, edit, and delete personal items
- Record item name, category, quantity, color, purchase date, and notes
- Filter and search items by category or keyword

### Purchase decision assistant

- Enter or upload information about a product the user wants to buy
- Compare the candidate product with existing inventory
- Display similar items and an explainable similarity score
- Return a recommendation: recommended, consider carefully, or not recommended

### Restock reminders

- Record an expected usage period for consumable items
- Estimate a restock date
- Display items that may run out soon

### Demonstration support

- Seed demo data
- Responsive web interface
- Clear setup instructions
- Docker-based local startup

## 5. Out of scope for the first version

- Automatic purchasing or payment
- Scraping private shopping accounts
- Training a custom machine-learning model
- Native mobile applications
- Real-time push notifications
- Supporting every possible item category

## 6. Technology stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React | User interface and interaction |
| Backend | Python FastAPI | REST API and recommendation logic |
| Database | PostgreSQL | Users, items, inventory, and reminders |
| Infrastructure | Docker Compose | Reproducible local development |
| AI integration | Vision/LLM API (optional after MVP) | Extract item attributes and explain recommendations |

## 7. Initial architecture

```text
React frontend
      |
      | REST/JSON
      v
FastAPI backend
      |
      v
PostgreSQL database
```

Docker Compose will run the frontend, backend, and database as separate services.

## 8. Explainable similarity score

The first version will use explicit weights instead of allowing an AI model to invent a percentage.

| Attribute | Weight |
| --- | ---: |
| Category | 30% |
| Color | 25% |
| Style | 20% |
| Material | 15% |
| Intended use | 10% |

The backend will calculate the score. An AI service may later help extract attributes from images or turn the result into a natural-language explanation.

## 9. Initial data entities

### User

- id
- email
- password_hash
- created_at

### Item

- id
- user_id
- name
- category
- quantity
- color
- style
- material
- intended_use
- purchase_date
- expected_usage_days
- image_url
- notes
- created_at
- updated_at

### Purchase evaluation

- id
- user_id
- candidate item attributes
- similarity score
- recommendation
- explanation
- created_at

## 10. Development phases

1. Project plan and repository workflow
2. Docker Compose and service skeletons
3. PostgreSQL schema and FastAPI CRUD endpoints
4. React inventory interface
5. Similarity calculation and purchase recommendation
6. Restock estimation
7. Optional AI image analysis
8. Testing, documentation, deployment, and demo video

## 11. Team workflow

- Create one branch for each feature or documentation task
- Make small, meaningful commits that describe actual progress
- Open a pull request before merging into `main`
- Review each other's changes
- Record challenges, decisions, and lessons learned
- Disclose significant AI assistance in the README

## 12. Success criteria

The MVP is successful when a new user can:

1. Start the system with Docker Compose
2. Add several personal items
3. Evaluate a possible purchase
4. See similar owned items and understand the recommendation
5. View products that may need restocking soon
