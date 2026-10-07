
const messages = {
    es: {
        zone: 'Zona', allZones: 'Todas', state: 'Estado', type: 'Tipo',
        all: 'Todos', active: 'Activas', resolved: 'Resueltas', dismissed: 'Descartadas',
        average: 'Tiempo prom. de resolución', minutes: 'min',
        manageRules: 'Configurar reglas', saveRules: 'Guardar reglas',
        rulesTitle: 'Reglas de alerta', facility: 'Estacionamiento',
        threshold: 'Umbral', enabled: 'Habilitada',
        nearLimit: 'Capacidad cercana al límite (%)',
        critical: 'Capacidad crítica (%)', stay: 'Permanencia máxima (min)',
        ruleSaved: 'Reglas guardadas', invalidThreshold: 'Revisa los umbrales ingresados.',
        invalidOrder: 'La capacidad cercana al límite debe ser menor que la capacidad crítica.',
        noAlerts: 'No hay alertas que coincidan con los filtros.',
        noResolved: '—', justNow: 'Ahora mismo',
        detected: 'Detectado', resolvedAt: 'Resuelto',
        dismiss: 'Descartar', rulesFailed: 'No se pudieron guardar las reglas.',
        retry: 'Reintentar', save: 'Guardar', cancel: 'Cancelar',
        zoneCapacity: 'al {value}% de capacidad', nearCapacity: 'cerca de su capacidad',
        overstay: 'excede el tiempo permitido', unknownPlate: 'Placa no reconocida',
        noReservation: 'Acceso sin reserva', vehicle: 'Vehículo',
        empty: 'No existen alertas para este estacionamiento.',
        loading: 'Cargando alertas…', unavailable: 'Datos de monitoreo no disponibles.'
    },
    en: {
        zone: 'Zone', allZones: 'All', state: 'Status', type: 'Type',
        all: 'All', active: 'Active', resolved: 'Resolved', dismissed: 'Dismissed',
        average: 'Average resolution time', minutes: 'min',
        manageRules: 'Configure rules', saveRules: 'Save rules',
        rulesTitle: 'Alert rules', facility: 'Parking facility',
        threshold: 'Threshold', enabled: 'Enabled',
        nearLimit: 'Capacity near limit (%)',
        critical: 'Critical capacity (%)', stay: 'Maximum stay (min)',
        ruleSaved: 'Rules saved', invalidThreshold: 'Check the rule thresholds.',
        invalidOrder: 'The near-limit threshold must be lower than the critical threshold.',
        noAlerts: 'No alerts match the selected filters.',
        noResolved: '—', justNow: 'Just now',
        detected: 'Detected', resolvedAt: 'Resolved',
        dismiss: 'Dismiss', rulesFailed: 'The rules could not be saved.',
        retry: 'Retry', save: 'Save', cancel: 'Cancel',
        zoneCapacity: 'at {value}% capacity', nearCapacity: 'near capacity',
        overstay: 'has exceeded the permitted time', unknownPlate: 'Unrecognized plate',
        noReservation: 'Access without reservation', vehicle: 'Vehicle',
        empty: 'No alerts are registered for this facility.',
        loading: 'Loading alerts…', unavailable: 'Monitoring data unavailable.'
    }
};

export function monitoringLabels(locale) {
    return String(locale).toLowerCase().startsWith('en') ? messages.en : messages.es;
}
