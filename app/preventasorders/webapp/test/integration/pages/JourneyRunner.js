sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"preventasorders/test/integration/pages/OrderList.gen",
	"preventasorders/test/integration/pages/OrderObjectPage.gen"
], function (JourneyRunner, OrderListGenerated, OrderObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('preventasorders') + '/test/flp.html#app-preview',
        pages: {
			onTheOrderListGenerated: OrderListGenerated,
			onTheOrderObjectPageGenerated: OrderObjectPageGenerated
        },
        async: true
    });

    return runner;
});

