export const InventoryEvents = {
    toServer: {
        fetchLocalData: 'mg-inventory:fetch:localData',
        fetchItemFromWeapon: 'mg-inventory:fetch:itemOfWeapon',
        leftClick: 'mg-inventory:click:left',
        rightClick: 'mg-inventory:click:right',
        middleClick: 'mg-inventory:click:middle',
        dragItem: 'mg-inventory:drag:item',
        clearSession: 'mg-inventory:session:clear',
    },
    toClient: {},
    toWebview: {
        close: 'mg-inventory:close',
        openLocal: 'mg-inventory:open:local',
        openGlobal: 'mg-inventory:open:global',
        updateView: 'mg-inventory:update:view',
    }
};