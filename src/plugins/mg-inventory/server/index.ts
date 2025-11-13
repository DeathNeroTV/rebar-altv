import { useRebar } from '@Server/index.js';

const Rebar = useRebar();

declare module '@Shared/types/items.js' {
    export interface RebarBaseItem {
        category?: string;
    }
}

Rebar.services.useServiceRegister().register('itemService', {
    add(entity, id, quantity, data) {
        return Promise.resolve(true);
    },
    has(entity, id, quantity) {
        return Promise.resolve(true);
    },
    hasSpace(entity, item) {
        return Promise.resolve(true);
    },
    itemCreate(data) {
        return Promise.resolve();
    },
    itemRemove(id) {
        return Promise.resolve();
    },
    remove(entity, uid) {
        return Promise.resolve(true);
    },
    sub(entity, id, quantity) {
        return Promise.resolve(true);
    },
    use(entity, uid) {
        return Promise.resolve(true);
    },
});