import express from 'express';
import dotenv from 'dotenv';
import routes from "./routes/index.mjs";
import cors from 'cors';
dotenv.config();

const app = express();

app.use(express.json());
app.use(routes);
app.use(cors({
  origin: '*'
}));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`server running on port ${port}.`);
});

export default app;