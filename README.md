# Database Audit Package

This package provides functionality for auditing database changes in MySQL.

## Installation

To install the package, run the following command:

```bash
npm install node-mysql-audit
```

Upon installation, a configuration file will be generated in your project directory. This file includes essential information for database connections and an exceptions array. Before utilizing the audit function, ensure that these configurations are properly defined.

## Usage
Importing the Package:

```js
import { initConnection, setupDatabaseAudit } from ('node-mysql-audit'); 
```

## Setting up Database Connection

```js
initConnection();
```

## Setting up Database Audit

```js
const userId = 1; // Provide the user ID
const username = 'admin'; // Provide the username

setupDatabaseAudit(userId, username);
```

## Configuration

You can configure the exceptions which are excluded from auditing by editing the auditConfig.json file.


Example auditConfig.json
```json
{
  "exceptions": ["auditlog"]
}
```
