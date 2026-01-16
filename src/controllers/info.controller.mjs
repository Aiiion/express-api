import { EMAIL, GITHUB } from "../utils/constants.mjs";
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import weatherApiService from "../services/weatherApi.service.mjs";

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

export const ipLocation = async (req, res) => {
    const ip = req.query.ip || req.ip;

    if (!net.isIP(ip)) {
        return res.status(400).send({
            error: 'Invalid IP address provided'
        });
    }

    try {
        const locationData = await weatherApiService.ipLocation(ip);
        return res.status(200).send({
            data: locationData
        });
    } catch (error) {
        console.error('ipLocation error:', error.message);
        return res.status(500).send({
            error: `Failed to retrieve location data for ${ip}`
        });
    }
};