import { EMAIL, GITHUB } from "../utils/constants.mjs";

export const test = (req, res) => res.status(200).send({message: 'API is running'});

export const contact = (req, res) => res.status(200).send({
    message: "Hello! I am Alex. Feel free to use this API. If you have any questions or feedback, please reach out to me via email or GitHub.",
    github: GITHUB,
    email: EMAIL
});

export const cv = (req, res) => res.status(200).sendFile('CV.pdf', { root: 'src/public/files' });
