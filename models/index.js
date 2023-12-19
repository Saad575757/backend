'use strict';
const fs        = require('fs');
const path      = require('path');
const basename  = path.basename(module.filename);
const db = {};

fs
  .readdirSync(__dirname)
  .filter(dir => {
    return (dir !== basename);
  })
  .forEach(dir => { 

      const knex = require("./"+dir+"/index")["knex"];
      const directory = __dirname + "/" + dir;
      db[dir] = {};

      fs
        .readdirSync(directory)
        .filter(file => {
            return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
        })
        .forEach(file => { 
            
            const model = require(directory + "/"+file);
            const name = file.split(".");
            
            db[dir][name[0]] = model.bindKnex(knex);
            
            // db[dir][name[0]] = model;

            
            if(model.relationMappings){

                db[dir][name[0]].relationArray = {};

                for(const alias in model.relationMappings)
                    if(typeof model.relationMappings[alias].modelClass === "string")
                        db[dir][name[0]].relationArray[alias] = { model : model.relationMappings[alias].modelClass.split("/").pop()}
                
            }
            
        });

  });

module.exports = db;