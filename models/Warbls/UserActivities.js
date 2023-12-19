'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class UserActivities extends Model {
    static get jsonSchema() {
        return { 
            default: ["activity_id", "activity_type", "user_id", "source", "browser_agent", "session", "url", "referer", "date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbUserActivities;
        
    }

    static get idColumn() {
        return 'activity_id';
    }
}
module.exports = UserActivities;

