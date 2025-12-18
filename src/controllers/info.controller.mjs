import { EMAIL, GITHUB } from "../utils/constants.mjs";
import path from 'path';
import { fileURLToPath } from 'url';

export const test = (req, res) => res.status(200).send({message: 'API is running'});

export const contact = (req, res) => res.status(200).send({
    message: "Hello! I am Alex. Feel free to use this API. If you have any questions or feedback, please reach out to me via email or GitHub.",
    github: GITHUB,
    email: EMAIL
});

export const cv = (req, res) => {
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const filePath = path.resolve(dirname, '../public/files/CV.pdf');
    return res.status(200).sendFile(filePath);
};
