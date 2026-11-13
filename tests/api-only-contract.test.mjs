import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
const read = path => readFileSync(path, 'utf8');
const walk = root => readdirSync(root, {withFileTypes: true}).flatMap(item =>
    item.isDirectory() ? walk(join(root, item.name)) : [join(root, item.name)]);

test('no hay almacenamiento local ni JSON server en codigo funcional', () => {
    for (const path of walk('src').filter(p => /\.(vue|js)$/.test(p))) {
        const source = read(path).replace(/\/\/[^\n]*/g, '');
        assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB|json-server)\b/, path);
        if (!path.endsWith('base-api.js')) {
            assert.doesNotMatch(source, /\b(?:fetch\s*\(|axios\.create\s*\()/, path);
        }
    }
});
test('reservas son comandos del API y no cambian espacios desde el cliente', () => {
    const src = read('src/reservations/application/reservations.store.js');
    assert.match(src, /api\.createReservation\(/);
    assert.match(src, /api\.updateReservation\(/);
    assert.doesNotMatch(src, /updateSpot\(|generateReservationCode\(|createParkingStay\(/);
});
test('accesos y reasignaciones pasan por la API', () => {
    const src = read('src/access-control/application/access-control.store.js');
    assert.match(src, /api\.createAccessMovement\(/);
    assert.match(src, /api\.updateParkingStay\(/);
    assert.doesNotMatch(src, /createParkingStay\(|\.updateSpot\(|\.updateReservation\(/);
});
test('endpoint de produccion apunta a Render y no al mock', () => {
    const env = read('.env.production');
    assert.match(env, /VITE_EASYPARK_API_URL="https:\/\/[^\s"]+\/api\/v1"/);
    assert.doesNotMatch(env, /localhost|127\.0\.0\.1|json-server/);
});
