'use strict';
const { createTables, pool } = require('./schema');
(async()=>{try{await createTables();console.log('Legacy baseline applied non-destructively.');}catch(error){console.error(error.message);process.exitCode=1;}finally{await pool.end();}})();
