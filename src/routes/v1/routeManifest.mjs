const _resources = [];
const _aggregates = [];

export function registerResource(info) {
    _resources.push(info);
}

export function registerAggregate(info) {
    _aggregates.push(info);
}

export function getManifest() {
    return { resources: [..._resources], aggregates: [..._aggregates] };
}
