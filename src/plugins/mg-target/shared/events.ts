export const TargetingEvents = {
    toClient: {
        openMenu: 'mg:target:menu:open',
        hasTarget: 'mg:target:menu:targeted',
        showTarget: 'mg:target:show',
        hideTarget: 'mg:target:hide',
        listTargets: 'mg:target:list',
        assignTargets: 'mg-target:list:assign',
    },
    toServer: {
        showTarget: 'mg:target:show',
        hideTarget: 'mg:target:hide'
    },
};