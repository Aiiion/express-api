import { sequelize } from '../models/index.mjs';

export const getModelTableName = (model) => {
    const tableName = model.getTableName?.() ?? model.tableName;

    if (typeof tableName === 'string') {
        return tableName;
    }

    return tableName?.tableName;
};

export const getMetaResourceModel = (req) => {
    const pathSegments = req.originalUrl.split('?')[0].split('/').filter(Boolean);
    const metaIndex = pathSegments.lastIndexOf('meta');
    const resource = metaIndex > 0 ? pathSegments[metaIndex - 1]?.toLowerCase() : undefined;
    if (!resource) {
        return undefined;
    }

    return Object.values(sequelize.models).find((model) => {
        const modelName = model.name?.toLowerCase();
        const tableName = getModelTableName(model)?.toLowerCase();

        return tableName === resource || modelName === resource || `${modelName}s` === resource;
    });
};