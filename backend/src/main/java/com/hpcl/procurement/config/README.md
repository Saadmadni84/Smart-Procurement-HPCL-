Config Layer
------------
Responsibility:
- Centralize application configuration such as DataSource, Flyway, security, and message brokers
- Provide beans for external adapters (SAP client, GeM connector) and feature toggles

Notes:
- Centralized config helps swap implementations for testing (e.g., in-memory DB vs MySQL)
- Add configuration properties classes under `config.properties` when the project grows
