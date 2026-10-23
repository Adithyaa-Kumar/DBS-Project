
# Data Dependency Tracker with Deletion Impact Visualizer

A cloud-deployed web application that helps users understand relational database dependencies and visualize the potential impact of deleting records. It provides an interactive interface for creating table schemas, managing records, analyzing relationships, and simulating deletion scenarios.

## Live Deployment

- **Frontend:** https://ddt-frontend.pages.dev
- **Backend:** https://ddt-backend-worker.dbsproject.workers.dev
- **Cloud Platform:** Cloudflare
- **Database:** Cloudflare D1

## Abstract

The Data Dependency Tracker with Deletion Impact Visualizer is designed to simplify the analysis of relational database dependencies and help prevent unintended data loss. Deleting a record may affect multiple related records through foreign-key relationships. This project provides a platform for defining table schemas, inserting records, examining relationships, and simulating the potential consequences of deletion before making changes.

The application uses React.js and Vite for the frontend, Cloudflare Workers for serverless backend processing, and Cloudflare D1 for persistent data storage. An interactive dependency graph, implemented using Cytoscape.js, displays relationships between records and helps users identify downstream dependencies. The dependency analysis engine traverses configured relationships to identify potentially affected records and determine a proposed cascading deletion order.

From a Cloud Architecture and Design perspective, the project demonstrates serverless computing, managed database services, REST API communication, and separation of presentation, application logic, and data persistence. This architecture reduces infrastructure management overhead while providing an interactive tool for understanding relational data integrity.

## Key Features

- **Dynamic Table Creation:** Define tables, columns, data types, primary keys, and foreign-key relationships.
- **Record Management:** Insert, view, and manage records.
- **Relationship Analysis:** Examine relationships and cardinalities between tables.
- **Deletion Impact Simulation:** Identify records potentially affected by deleting a selected record.
- **Interactive Dependency Graph:** Visualize dependencies using Cytoscape.js.
- **Cascade Order Analysis:** Determine a proposed order for analyzing dependent records.
- **Query Support:** Perform supported join and complex queries.
- **Cloud Data Persistence:** Store table metadata and records in Cloudflare D1.

## Cloud Architecture

```text
                 User / Browser
                       |
                       v
               Cloudflare Pages
              React + Vite Frontend
                       |
                 HTTPS / REST API
                       |
                       v
              Cloudflare Workers
             Serverless Backend API
                       |
              Dependency Analysis
                       |
                       v
                Cloudflare D1
             Persistent SQL Storage
```

### Architecture Components

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React.js, Vite | User interface and interactions |
| API Client | Axios | HTTP communication with the backend |
| Visualization | Cytoscape.js | Interactive dependency graphs |
| Backend | Cloudflare Workers | Serverless API and application logic |
| Database | Cloudflare D1 | Persistent storage |
| Dependency Engine | JavaScript | Relationship traversal and impact analysis |

### Data Storage Design

The D1 storage adapter uses two core tables:

- `tables` — stores user-defined table names and column definitions as JSON metadata.
- `rows` — stores records as JSON payloads associated with their table names.

User-defined tables are represented through application metadata rather than automatically becoming separate physical SQL tables in D1. The application uses the configured relationships to analyze dependencies.

## Technology Stack

**Frontend**
- React.js
- Vite
- Axios
- Cytoscape.js
- CSS

**Backend**
- Cloudflare Workers
- JavaScript ES modules
- REST API

**Database and Deployment**
- Cloudflare D1
- Cloudflare Pages
- Wrangler
- GitHub

## How It Works

1. Create a table and define its columns.
2. Configure primary keys and foreign-key relationships.
3. Insert sample records into the tables.
4. Inspect relationships between tables.
5. Select a record for deletion-impact analysis.
6. Run the dependency simulation.
7. Examine the affected records, proposed order, and dependency graph.

## Getting Started

### Prerequisites

- Node.js and npm
- Git (optional)
- A web browser

### Run the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development URL in the terminal.

### Build the Frontend

```bash
npm run build
```

The production build is generated in the `frontend/dist/` directory.

## Cloud Deployment

### Frontend — Cloudflare Pages

The frontend is hosted on Cloudflare Pages.

Typical build settings:

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

To deploy manually:

```bash
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name ddt-frontend
```

### Backend — Cloudflare Workers

The backend configuration is defined in `backend/wrangler.toml`.

To deploy:

```bash
cd backend
npm install
npx wrangler login
npx wrangler deploy
```

Before deploying, verify the Worker name, D1 database ID, and database binding. Do not change the existing database configuration without confirming the intended database.

**Security:** Never commit API tokens, passwords, or other credentials to the repository.

## API Overview

The backend provides endpoints for the following operations:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/tables` | List tables |
| POST | `/api/tables` | Create a table definition |
| GET | `/api/tables/:tableName` | Retrieve table information |
| GET | `/api/tables/:tableName/rows` | Retrieve records |
| POST | `/api/tables/:tableName/rows` | Insert a record |
| DELETE | `/api/tables/:tableName/rows/:pkValue` | Delete a record |
| GET | `/api/relationships` | Analyze relationships |
| POST | `/api/simulate-deletion` | Simulate deletion impact |
| POST | `/api/cascade-order` | Calculate a proposed cascade order |
| POST | `/api/query/join` | Execute a supported join query |
| POST | `/api/query/complex` | Execute a supported complex query |
| POST | `/api/clear` | Clear application data |

Refer to `backend/src/index.js` for the implemented endpoint details and request formats.

## Advantages of the Cloud Architecture

- Serverless backend execution reduces server administration.
- Managed D1 storage provides persistent data storage.
- The frontend and backend are deployed as separate services.
- REST APIs enable communication between application layers.
- Cloud deployment makes the application accessible through public URLs.
- Dependency visualization improves understanding of relational data relationships.

## Limitations

- Authentication and role-based access control can be added.
- Referential integrity enforcement can be strengthened.
- Large datasets may require optimized dependency queries.
- Automated integration and deployment testing can be expanded.
- Monitoring, audit logging, and recovery mechanisms can be improved.
- The frontend API URL can be configured through environment-specific settings.

## Future Enhancements

- User authentication and access control.
- Advanced dependency analysis for large datasets.
- Configurable deletion policies.
- Detailed audit logs and operation history.
- Automated testing and deployment pipelines.
- Improved monitoring, backup, and recovery support.
- Enhanced query optimization and visualization.

## Academic Relevance

This project demonstrates key concepts from **Cloud Architecture and Design**, including serverless computing, managed cloud databases, API-based communication, layered architecture, persistent storage, and the visualization of relational database dependencies.

## License

No explicit open-source license is included in the repository.
