const createServer = require('./app');
const sequelize = require('./utils/db');

(async ()=>{
    await sequelize.sync();
    const app = await createServer();

    const PORT = 4000;
    app.listen(PORT, ()=>console.log(`Server running at http://localhost:${PORT}/graphql`));
})();
