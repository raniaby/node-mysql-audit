const mysql = require("@vlasky/mysql");
const MySQLEvents = require("@raniaby/mysql-events");
import fs from 'node:fs/promises';


let connectionObj: Record<string, any> = {};


async function loadExceptions() {
  try {
    const jsonContent = await fs.readFile('auditConfig.json', 'utf8');
    const exceptionsData = JSON.parse(jsonContent);
    const exceptions = exceptionsData.exceptions || [];
    return exceptions; 
  } catch (error) {
    console.error('Error loading exceptions:', error);
  }
}

async function loadDBCredentials(){
  try {
    const jsonContent = await fs.readFile('auditConfig.json', 'utf8');
    const parsedData = JSON.parse(jsonContent);
    const DBCredentials = parsedData.DBCredentials || [];
    return DBCredentials; 
  } catch (error) {
    console.error('Error loading DB credentials:', error);
  }
}


export async function initConnection() {
  try {
    const options = await loadDBCredentials();
    const connection = mysql.createConnection(options);
    const instance = new MySQLEvents(connection, {
      startAtEnd: true,
      excludedSchemas: {
        mysql: true,
      },
    });
    instance.start();

    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
    connectionObj.instance= instance;
    connectionObj.connection= connection;
    connectionObj.database = options.database;

  } catch (error) {
    console.error("Error setup audit configuration:", error);
  }
}

export async function setupDatabaseAudit(
  userId: number | null,
  username: string | null
) {
  try {
    const exceptions = await loadExceptions();
    connectionObj.instance.removeTrigger({
      name: "AUDIT_TRIGGER",
      expression: `${connectionObj.database}.*`,
      statement: MySQLEvents.STATEMENTS.ALL
    })
    connectionObj.instance.addTrigger({
      name: "AUDIT_TRIGGER",
      expression: `${connectionObj.database}.*`,
      statement: MySQLEvents.STATEMENTS.ALL,
      onEvent: async (event: any) => {
        const eventType = event.type;
        const table = event.table;
        let oldValues = event.affectedRows[0].before;
        let newValues = event.affectedRows[0].after;
        let updatedColumns = event.affectedColumns;
        if(!exceptions.includes(table)){
          const createTableQuery = `
          CREATE TABLE IF NOT EXISTS auditlog (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_type VARCHAR(255) NOT NULL,
            table_name VARCHAR(255) NOT NULL,
            old_values JSON DEFAULT NULL,
            new_values JSON DEFAULT NULL,
            updated_columns JSON DEFAULT NULL,
            connected_user_id INT DEFAULT NULL,
            connected_user_name VARCHAR(255) DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `;

        connectionObj.connection.query(createTableQuery);
        const insertQuery = `
          INSERT INTO auditlog (event_type, table_name,  old_values, new_values, updated_columns, connected_user_id, connected_user_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        connectionObj.connection.query(insertQuery, [
          eventType,
          table,
          JSON.stringify(oldValues),
          JSON.stringify(newValues),
          JSON.stringify(updatedColumns),
          userId,
          username,
          new Date(),
        ]);
        }

      },
    });

  } catch (error) {
    console.error(error);
  }
}
